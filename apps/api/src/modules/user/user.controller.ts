import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { USERS_READ_ROLES } from "../../common/constants/readiness-roles";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
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
      "Lists active users for ops screens such as the assessment roster, optionally filtered by role. Returns no credentials.",
  })
  @ApiOkResponse({ description: "Active users" })
  getUsers(@Query() query: ListUsersQueryDto) {
    return this.userService.listUsers({ role: query.role });
  }
}
