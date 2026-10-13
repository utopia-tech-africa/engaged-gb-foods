import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { NETWORK_WRITE_ROLES } from "../../common/constants/network-roles";
import { USERS_READ_ROLES } from "../../common/constants/readiness-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { UserService } from "./user.service";

@ApiTags("Users")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Get()
  @Roles(...USERS_READ_ROLES)
  @ApiOperation({
    operationId: "getUsers",
    summary: "List users",
    description:
      "Lists users for ops screens, optionally filtered by role, active flag, or a search term on name, staff ID, or email. Omit isActive to include inactive users. Returns no credentials.",
  })
  @ApiOkResponse({ description: "Matching users", type: [UserResponseDto] })
  getUsers(@Query() query: ListUsersQueryDto) {
    return this.userService.listUsers({
      role: query.role,
      isActive: query.isActive,
      q: query.q,
    });
  }

  @Get(":id")
  @Roles(...USERS_READ_ROLES)
  @ApiOperation({
    operationId: "getUsersById",
    summary: "Get user by id",
    description: "Returns a single user profile. Never includes PIN or password hashes.",
  })
  @ApiOkResponse({ description: "User profile", type: UserResponseDto })
  getUsersById(@Param("id") id: string) {
    return this.userService.getUserById(id);
  }

  @Post()
  @Roles(...NETWORK_WRITE_ROLES)
  @ApiOperation({
    operationId: "postUsers",
    summary: "Create user",
    description:
      "Creates a user. Field roles (qc, handler, cluster_supervisor, regional_supervisor) need a staff ID and PIN. Desk roles (admin, national_ops, national_quality, gbfoods_reviewer) need an email and password.",
  })
  @ApiCreatedResponse({ description: "User created", type: UserResponseDto })
  postUsers(@Body() body: CreateUserDto) {
    return this.userService.createUser(body);
  }

  @Patch(":id")
  @Roles(...NETWORK_WRITE_ROLES)
  @ApiOperation({
    operationId: "patchUsersById",
    summary: "Update user",
    description:
      "Updates profile fields or the active flag. Send pin or password to reset credentials; resetting a PIN also clears the lock. Deactivating or resetting credentials signs the user out of existing sessions.",
  })
  @ApiOkResponse({ description: "User updated", type: UserResponseDto })
  patchUsersById(
    @Param("id") id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.userService.updateUser(id, body, actor.id);
  }
}
