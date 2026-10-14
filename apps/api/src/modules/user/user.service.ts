import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type User, type UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

import { isFieldRole } from "../../common/constants/user-roles";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";
import type { UserResponseDto } from "./dto/user-response.dto";

const HASH_ROUNDS = 10;

export type ListUsersFilters = {
  role?: UserRole;
  isActive?: boolean;
  q?: string;
};

const toUserResponse = (user: User): UserResponseDto => ({
  id: user.id,
  fullName: user.fullName,
  staffId: user.staffId,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
  hasPin: user.pinHash !== null,
  hasPassword: user.passwordHash !== null,
  lockedAt: user.lockedAt?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

const STAFF_ID_PREFIX = "BTL-";
const STAFF_ID_PATTERN = /^BTL-(\d+)$/i;
const STAFF_ID_PAD = 4;
const STAFF_ID_ALLOCATE_ATTEMPTS = 5;

const normalizeStaffId = (value: string): string => value.trim().toUpperCase();
const normalizeEmail = (value: string): string => value.trim().toLowerCase();

@Injectable()
export class UserService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listUsers(filters: ListUsersFilters): Promise<UserResponseDto[]> {
    const search = filters.q?.trim();
    const users = await this.prisma.user.findMany({
      where: {
        role: filters.role,
        isActive: filters.isActive,
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { staffId: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { fullName: "asc" },
    });
    return users.map(toUserResponse);
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    return toUserResponse(await this.findOrThrow(id));
  }

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const fieldRole = isFieldRole(dto.role);
    const email = dto.email ? normalizeEmail(dto.email) : null;

    if (fieldRole) {
      if (!dto.pin) {
        throw new BadRequestException("Field roles require a PIN");
      }
      if (dto.password) {
        throw new BadRequestException("Field roles sign in with a PIN, not a password");
      }
      if (email) {
        throw new BadRequestException("Field roles sign in with a staff ID, not an email");
      }
    } else {
      if (!email || !dto.password) {
        throw new BadRequestException("Desk roles require email and password");
      }
      if (dto.pin) {
        throw new BadRequestException("Desk roles sign in with a password, not a PIN");
      }
      if (dto.staffId) {
        throw new BadRequestException("Only field roles have a staff ID");
      }
    }

    const pinHash = dto.pin ? await bcrypt.hash(dto.pin, HASH_ROUNDS) : null;
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, HASH_ROUNDS) : null;
    const base = {
      fullName: dto.fullName.trim(),
      role: dto.role,
      email,
      phone: dto.phone?.trim() || null,
      pinHash,
      passwordHash,
      isActive: dto.isActive ?? true,
    };

    if (!fieldRole) {
      try {
        const user = await this.prisma.user.create({ data: { ...base, staffId: null } });
        return toUserResponse(user);
      } catch (error) {
        throw this.mapUniqueViolation(error);
      }
    }

    const requestedStaffId = dto.staffId ? normalizeStaffId(dto.staffId) : null;
    if (requestedStaffId) {
      try {
        const user = await this.prisma.user.create({
          data: { ...base, staffId: requestedStaffId },
        });
        return toUserResponse(user);
      } catch (error) {
        throw this.mapUniqueViolation(error);
      }
    }

    for (let attempt = 0; attempt < STAFF_ID_ALLOCATE_ATTEMPTS; attempt += 1) {
      const staffId = await this.allocateNextStaffId();
      try {
        const user = await this.prisma.user.create({
          data: { ...base, staffId },
        });
        return toUserResponse(user);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempt < STAFF_ID_ALLOCATE_ATTEMPTS - 1
        ) {
          continue;
        }
        throw this.mapUniqueViolation(error);
      }
    }

    throw new ConflictException("Unable to allocate a unique staff ID");
  }

  async updateUser(id: string, dto: UpdateUserDto, actorId: string): Promise<UserResponseDto> {
    const existing = await this.findOrThrow(id);
    const fieldRole = isFieldRole(existing.role);

    if (dto.isActive === false && id === actorId) {
      throw new BadRequestException("You cannot deactivate your own account");
    }
    if (dto.staffId !== undefined) {
      throw new BadRequestException("Staff ID is assigned by the system and cannot be changed");
    }
    if (dto.email !== undefined && fieldRole) {
      throw new BadRequestException("Only desk roles have an email");
    }
    if (dto.pin !== undefined && !fieldRole) {
      throw new BadRequestException("Only field roles use a PIN");
    }
    if (dto.password !== undefined && fieldRole) {
      throw new BadRequestException("Only desk roles use a password");
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.fullName !== undefined) {
      data.fullName = dto.fullName.trim();
    }
    if (dto.email !== undefined) {
      data.email = normalizeEmail(dto.email);
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone.trim() || null;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }
    if (dto.pin !== undefined) {
      data.pinHash = await bcrypt.hash(dto.pin, HASH_ROUNDS);
      data.failedPinAttempts = 0;
      data.lockedAt = null;
    }
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, HASH_ROUNDS);
    }

    const revokeSessions =
      dto.isActive === false || dto.pin !== undefined || dto.password !== undefined;

    try {
      const [user] = await this.prisma.$transaction([
        this.prisma.user.update({ where: { id }, data }),
        ...(revokeSessions
          ? [
              this.prisma.authSession.updateMany({
                where: { userId: id, revokedAt: null },
                data: { revokedAt: new Date() },
              }),
            ]
          : []),
      ]);
      return toUserResponse(user);
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }
  }

  private async findOrThrow(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  /** Next unused BTL-#### after the highest existing numeric staff ID. */
  private async allocateNextStaffId(): Promise<string> {
    const existing = await this.prisma.user.findMany({
      where: { staffId: { startsWith: STAFF_ID_PREFIX } },
      select: { staffId: true },
    });

    let highest = 0;
    for (const row of existing) {
      const match = STAFF_ID_PATTERN.exec(row.staffId ?? "");
      if (!match?.[1]) {
        continue;
      }
      highest = Math.max(highest, Number.parseInt(match[1], 10));
    }

    return `${STAFF_ID_PREFIX}${String(highest + 1).padStart(STAFF_ID_PAD, "0")}`;
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new ConflictException("Staff ID or email is already in use");
    }
    return error;
  }
}
