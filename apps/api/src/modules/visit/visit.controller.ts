import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { FIELD_VISIT_CLOSE_ROLES, VISIT_READ_ROLES } from "../../common/constants/visit-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CloseVisitDto } from "./dto/close-visit.dto";
import { CreateVisitSignatureDto } from "./dto/create-visit-signature.dto";
import { ListVisitsQueryDto } from "./dto/list-visits-query.dto";
import {
  ReconciliationSnapshotResponseDto,
  VisitSignatureResponseDto,
  VisitSummaryResponseDto,
} from "./dto/visit-response.dto";
import { VisitService } from "./visit.service";

@ApiTags("Visits")
@Controller("visits")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VisitController {
  constructor(@Inject(VisitService) private readonly visitService: VisitService) {}

  @Get()
  @Roles(...VISIT_READ_ROLES)
  @ApiOperation({
    operationId: "getVisits",
    summary: "List visits",
    description: "Lists depot visits for operations and field users within assignment scope.",
  })
  @ApiOkResponse({ description: "Visit list", type: [VisitSummaryResponseDto] })
  getVisits(@CurrentUser() user: AuthenticatedUser, @Query() query: ListVisitsQueryDto) {
    return this.visitService.listVisits(user.id, user.role, {
      depotId: query.depotId,
      date: query.date,
      status: query.status,
    });
  }

  @Get(":id/reconciliation")
  @Roles(...VISIT_READ_ROLES)
  @ApiOperation({
    operationId: "getVisitsByIdReconciliation",
    summary: "Visit reconciliation",
    description:
      "Derived stock balance by SKU and batch, held-lot custodian gaps, signatures, and close readiness.",
  })
  @ApiOkResponse({
    description: "Reconciliation snapshot",
    type: ReconciliationSnapshotResponseDto,
  })
  getVisitsByIdReconciliation(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.visitService.getReconciliation(id, user.id, user.role);
  }

  @Post(":id/signatures")
  @Roles(
    ...FIELD_VISIT_CLOSE_ROLES,
    "cluster_supervisor",
    "regional_supervisor",
    "national_ops",
    "national_quality",
    "admin",
  )
  @ApiOperation({
    operationId: "postVisitsByIdSignatures",
    summary: "Record visit signature",
    description:
      "Captures QC, cluster supervisor, or depot representative sign-off with optional drawn signature image.",
  })
  @ApiCreatedResponse({ description: "Signature recorded", type: VisitSignatureResponseDto })
  postVisitsByIdSignatures(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: CreateVisitSignatureDto,
  ) {
    return this.visitService.addSignature(id, user.id, user.role, body);
  }

  @Post(":id/close")
  @Roles(
    ...FIELD_VISIT_CLOSE_ROLES,
    "cluster_supervisor",
    "regional_supervisor",
    "national_ops",
    "national_quality",
    "admin",
  )
  @ApiOperation({
    operationId: "postVisitsByIdClose",
    summary: "Close visit",
    description:
      "Completes reconciliation when balanced and signed, or closes as exception with open actions.",
  })
  @ApiCreatedResponse({ description: "Visit closed", type: VisitSummaryResponseDto })
  postVisitsByIdClose(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: CloseVisitDto,
  ) {
    return this.visitService.closeVisit(id, user.id, user.role, body);
  }
}
