import { randomBytes } from "node:crypto";
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { type User, type UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import type { EnvironmentVariables } from "../../config/environment";
import { PrismaService } from "../prisma/prisma.service";
import type { FieldSignInDto } from "./dto/field-sign-in.dto";
import type { OpsSignInDto } from "./dto/ops-sign-in.dto";

const FIELD_ROLES: UserRole[] = ["qc", "handler", "cluster_supervisor", "regional_supervisor"];

const OPS_ROLES: UserRole[] = ["national_ops", "national_quality", "admin", "gbfoods_reviewer"];

const MAX_FAILED_PIN_ATTEMPTS = 5;

export type AuthTokenResponse = {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async signInField(
    body: FieldSignInDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokenResponse> {
    const staffId = body.staffId.trim().toUpperCase();
    const user = await this.prisma.user.findUnique({ where: { staffId } });

    if (!user?.pinHash || !FIELD_ROLES.includes(user.role)) {
      throw new UnauthorizedException("Invalid staff ID or PIN");
    }

    this.assertActive(user);

    if (user.lockedAt) {
      throw new ForbiddenException("Account is locked. Ask a supervisor to unlock it.");
    }

    const pinValid = await bcrypt.compare(body.pin, user.pinHash);
    if (!pinValid) {
      const failedPinAttempts = user.failedPinAttempts + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedPinAttempts,
          lockedAt: failedPinAttempts >= MAX_FAILED_PIN_ATTEMPTS ? new Date() : null,
        },
      });
      throw new UnauthorizedException("Invalid staff ID or PIN");
    }

    if (user.failedPinAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedPinAttempts: 0, lockedAt: null },
      });
    }

    return this.issueTokens(user, userAgent, ipAddress);
  }

  async signInOps(
    body: OpsSignInDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokenResponse> {
    const email = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash || !OPS_ROLES.includes(user.role)) {
      throw new UnauthorizedException("Invalid email or password");
    }

    this.assertActive(user);

    const passwordValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.issueTokens(user, userAgent, ipAddress);
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponse> {
    const { sessionId, secret } = this.parseRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Refresh token is invalid or expired");
    }

    const matches = await bcrypt.compare(secret, session.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException("Refresh token is invalid or expired");
    }

    this.assertActive(session.user);

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(session.user);
  }

  async signOut(refreshToken: string): Promise<void> {
    try {
      const { sessionId, secret } = this.parseRefreshToken(refreshToken);
      const session = await this.prisma.authSession.findUnique({ where: { id: sessionId } });
      if (!session || session.revokedAt) {
        return;
      }
      const matches = await bcrypt.compare(secret, session.refreshTokenHash);
      if (!matches) {
        return;
      }
      await this.prisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Sign-out is idempotent.
    }
  }

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) {
      throw new UnauthorizedException("User is not available");
    }
    return this.toAuthenticatedUser(user);
  }

  async validateAccessTokenSubject(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) {
      return null;
    }
    return this.toAuthenticatedUser(user);
  }

  private assertActive(user: User): void {
    if (!user.isActive) {
      throw new ForbiddenException("Account is inactive");
    }
  }

  private async issueTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokenResponse> {
    const accessTtlSeconds = this.configService.get("JWT_ACCESS_TTL_SECONDS", { infer: true });
    const refreshTtlDays = this.configService.get("JWT_REFRESH_TTL_DAYS", { infer: true });
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: this.configService.get("JWT_ACCESS_SECRET", { infer: true }),
        expiresIn: accessTtlSeconds,
      },
    );

    const secret = randomBytes(32).toString("base64url");
    const refreshTokenHash = await bcrypt.hash(secret, 10);
    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: this.toAuthenticatedUser(user),
      accessToken,
      refreshToken: `${session.id}.${secret}`,
      expiresIn: accessTtlSeconds,
    };
  }

  private parseRefreshToken(refreshToken: string): { sessionId: string; secret: string } {
    const separator = refreshToken.indexOf(".");
    if (separator <= 0) {
      throw new UnauthorizedException("Refresh token is invalid or expired");
    }
    return {
      sessionId: refreshToken.slice(0, separator),
      secret: refreshToken.slice(separator + 1),
    };
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      fullName: user.fullName,
      staffId: user.staffId,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
