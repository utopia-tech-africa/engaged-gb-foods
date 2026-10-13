import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { READINESS_WRITE_ROLES } from "../../common/constants/readiness-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AssessmentService } from "./assessment.service";
import { AssessmentResponseDto } from "./dto/assessment-response.dto";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { ListAssessmentsQueryDto } from "./dto/list-assessments-query.dto";

@ApiTags("Assessments")
@Controller("assessments")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssessmentController {
  constructor(@Inject(AssessmentService) private readonly assessmentService: AssessmentService) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getAssessments",
    summary: "List assessments",
    description:
      "Lists the latest training assessment per user with a dispatchable flag. Filter by user or pass/fail result. Set history=true to list every assessment.",
  })
  @ApiOkResponse({ description: "Assessment roster", type: [AssessmentResponseDto] })
  getAssessments(@Query() query: ListAssessmentsQueryDto) {
    return this.assessmentService.listAssessments({
      userId: query.userId,
      result: query.result,
      history: query.history ?? false,
    });
  }

  @Get(":id")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getAssessmentsById",
    summary: "Get assessment by id",
    description: "Returns a single assessment with the assessed user and assessor.",
  })
  @ApiOkResponse({ description: "Assessment detail", type: AssessmentResponseDto })
  getAssessmentsById(@Param("id") id: string) {
    return this.assessmentService.getAssessmentById(id);
  }

  @Post()
  @Roles(...READINESS_WRITE_ROLES)
  @ApiOperation({
    operationId: "postAssessments",
    summary: "Record assessment",
    description:
      "Records a safety, quality, and record-keeping assessment for a field user. All three must pass for a pass result and dispatch eligibility; otherwise the result is fail. Each submission becomes the user's latest assessment.",
  })
  @ApiCreatedResponse({ description: "Assessment recorded", type: AssessmentResponseDto })
  postAssessments(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAssessmentDto) {
    return this.assessmentService.createAssessment(user.id, body);
  }
}
