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

import { FIELD_ATTENDANCE_WRITE_ROLES } from "../../common/constants/attendance-roles";
import { NETWORK_READ_ROLES, NETWORK_WRITE_ROLES } from "../../common/constants/network-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AssignmentService } from "./assignment.service";
import { AssignmentResponseDto } from "./dto/assignment-response.dto";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { ListAssignmentsQueryDto } from "./dto/list-assignments-query.dto";
import { MyDepotResponseDto } from "./dto/my-depot-response.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";

@ApiTags("Assignments")
@Controller("assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssignmentController {
  constructor(@Inject(AssignmentService) private readonly assignmentService: AssignmentService) {}

  @Get("me/depots")
  @Roles(...FIELD_ATTENDANCE_WRITE_ROLES)
  @ApiOperation({
    operationId: "getMeDepots",
    summary: "List my assigned depots",
    description: "Returns active depots within the user's assignment scope for field check-in.",
  })
  @ApiOkResponse({ description: "Depots assigned to current user", type: [MyDepotResponseDto] })
  getMeDepots(@CurrentUser() user: AuthenticatedUser) {
    return this.assignmentService.listDepotsForUser(user.id);
  }

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getAssignments",
    summary: "List assignments",
    description:
      "Returns user network assignments with scope and effective dates, optionally filtered by user.",
  })
  @ApiOkResponse({ description: "List of assignments", type: [AssignmentResponseDto] })
  getAssignments(@Query() query: ListAssignmentsQueryDto) {
    return this.assignmentService.listAssignments(query.userId);
  }

  @Post()
  @Roles(...NETWORK_WRITE_ROLES)
  @ApiOperation({
    operationId: "postAssignments",
    summary: "Create assignment",
    description: "Assigns a field user (typically QC) to a distributor, cluster, or region scope.",
  })
  @ApiCreatedResponse({ description: "Assignment created", type: AssignmentResponseDto })
  postAssignments(@Body() body: CreateAssignmentDto) {
    return this.assignmentService.createAssignment(body);
  }

  @Patch(":id")
  @Roles(...NETWORK_WRITE_ROLES)
  @ApiOperation({
    operationId: "patchAssignmentsById",
    summary: "End assignment",
    description:
      "Sets the effective end date of an assignment (defaults to now), which removes the scope from the user's depot list once the date has passed.",
  })
  @ApiOkResponse({ description: "Assignment updated", type: AssignmentResponseDto })
  patchAssignmentsById(@Param("id") id: string, @Body() body: UpdateAssignmentDto) {
    return this.assignmentService.endAssignment(id, body);
  }
}
