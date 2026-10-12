import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { NETWORK_READ_ROLES, NETWORK_WRITE_ROLES } from "../../common/constants/network-roles";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AssignmentService } from "./assignment.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";

@ApiTags("Assignments")
@Controller("assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssignmentController {
  constructor(@Inject(AssignmentService) private readonly assignmentService: AssignmentService) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getAssignments",
    summary: "List assignments",
    description: "Returns user network assignments with scope and effective dates.",
  })
  @ApiOkResponse({ description: "List of assignments" })
  getAssignments() {
    return this.assignmentService.listAssignments();
  }

  @Post()
  @Roles(...NETWORK_WRITE_ROLES)
  @ApiOperation({
    operationId: "postAssignments",
    summary: "Create assignment",
    description: "Assigns a field user (typically QC) to a distributor, cluster, or region scope.",
  })
  @ApiCreatedResponse({ description: "Assignment created" })
  postAssignments(@Body() body: CreateAssignmentDto) {
    return this.assignmentService.createAssignment(body);
  }
}
