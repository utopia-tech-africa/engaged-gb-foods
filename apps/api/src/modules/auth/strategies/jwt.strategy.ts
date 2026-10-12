import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { AuthenticatedUser } from "../../../common/types/authenticated-user.type";
import type { EnvironmentVariables } from "../../../config/environment";
import { AuthService } from "../auth.service";

type JwtPayload = {
  sub: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService)
    configService: ConfigService<EnvironmentVariables, true>,
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_ACCESS_SECRET", { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authService.validateAccessTokenSubject(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Session is no longer valid");
    }
    return user;
  }
}
