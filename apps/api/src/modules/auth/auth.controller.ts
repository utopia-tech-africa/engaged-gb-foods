import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request } from "express";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { AuthService } from "./auth.service";
import { FieldSignInDto } from "./dto/field-sign-in.dto";
import { OpsSignInDto } from "./dto/ops-sign-in.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("field/sign-in")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: "postAuthFieldSignIn",
    summary: "Sign in with staff ID and PIN",
    description: "Authenticates a field user and returns an access and refresh token pair.",
  })
  @ApiOkResponse({ description: "Field sign-in successful" })
  @ApiUnauthorizedResponse({ description: "Invalid staff ID or PIN" })
  postAuthFieldSignIn(@Body() body: FieldSignInDto, @Req() request: Request) {
    return this.authService.signInField(body, request.headers["user-agent"], request.ip);
  }

  @Post("ops/sign-in")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: "postAuthOpsSignIn",
    summary: "Sign in with email and password",
    description:
      "Authenticates an operations, quality, admin, or GBfoods reviewer user and returns tokens.",
  })
  @ApiOkResponse({ description: "Ops sign-in successful" })
  @ApiUnauthorizedResponse({ description: "Invalid email or password" })
  postAuthOpsSignIn(@Body() body: OpsSignInDto, @Req() request: Request) {
    return this.authService.signInOps(body, request.headers["user-agent"], request.ip);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: "postAuthRefresh",
    summary: "Refresh access token",
    description: "Exchanges a valid refresh token for a new access and refresh token pair.",
  })
  postAuthRefresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post("sign-out")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: "postAuthSignOut",
    summary: "Sign out",
    description: "Revokes the refresh token session when it is still valid.",
  })
  async postAuthSignOut(@Body() body: RefreshTokenDto): Promise<void> {
    await this.authService.signOut(body.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: "getAuthMe",
    summary: "Get current user",
    description: "Returns the authenticated user profile for the bearer access token.",
  })
  getAuthMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }
}
