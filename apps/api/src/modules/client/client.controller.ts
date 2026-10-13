import { Controller, Get, Header, Inject, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from "@nestjs/swagger";

import { CLIENT_READ_ROLES } from "../../common/constants/client-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ClientService } from "./client.service";
import { ClientDateQueryDto } from "./dto/client-date-query.dto";
import { ClientExportQueryDto } from "./dto/client-export-query.dto";
import { ClientOverviewQueryDto } from "./dto/client-overview-query.dto";
import { ClientDepotPackResponseDto, ClientOverviewResponseDto } from "./dto/client-response.dto";

@ApiTags("Client")
@Controller("client")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientController {
  constructor(@Inject(ClientService) private readonly clientService: ClientService) {}

  @Get("overview")
  @Roles(...CLIENT_READ_ROLES)
  @ApiOperation({
    operationId: "getClientOverview",
    summary: "Client control room overview",
    description:
      "Returns KPIs and per-depot status for GBfoods reviewers: completion, review queues, holds, and sync delays for a calendar day.",
  })
  @ApiOkResponse({ description: "Control room overview", type: ClientOverviewResponseDto })
  getClientOverview(@Query() query: ClientOverviewQueryDto) {
    return this.clientService.getOverview({
      date: query.date,
      regionId: query.regionId,
      depotId: query.depotId,
      reviewStatus: query.reviewStatus,
    });
  }

  @Get("export/reconciliation.csv")
  @Roles(...CLIENT_READ_ROLES)
  @ApiOperation({
    operationId: "getClientExportReconciliationCsv",
    summary: "Export depot reconciliation CSV",
    description:
      "Downloads reconciliation lines by depot, SKU, and batch for the selected day and optional region filter.",
  })
  @ApiProduces("text/csv")
  @ApiOkResponse({ description: "CSV file", schema: { type: "string" } })
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="reconciliation.csv"')
  getClientExportReconciliationCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ClientExportQueryDto,
  ) {
    return this.clientService.exportReconciliationCsv(user.id, user.role, {
      date: query.date,
      regionId: query.regionId,
    });
  }

  @Get("export/holds.csv")
  @Roles(...CLIENT_READ_ROLES)
  @ApiOperation({
    operationId: "getClientExportHoldsCsv",
    summary: "Export quality holds CSV",
    description:
      "Downloads held-or-rejected lots with custodian and latest disposition for the selected day and optional region.",
  })
  @ApiProduces("text/csv")
  @ApiOkResponse({ description: "CSV file", schema: { type: "string" } })
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="holds.csv"')
  getClientExportHoldsCsv(@Query() query: ClientExportQueryDto) {
    return this.clientService.exportHoldsCsv({
      date: query.date,
      regionId: query.regionId,
    });
  }

  @Get("depots/:depotId/pack")
  @Roles(...CLIENT_READ_ROLES)
  @ApiOperation({
    operationId: "getClientDepotsByIdPack",
    summary: "Depot reconciliation pack",
    description:
      "Returns reconciliation snapshots, stock lots, and hold log for one depot on a calendar day (CSV-friendly JSON).",
  })
  @ApiOkResponse({ description: "Depot pack", type: ClientDepotPackResponseDto })
  getClientDepotsByIdPack(
    @CurrentUser() user: AuthenticatedUser,
    @Param("depotId") depotId: string,
    @Query() query: ClientDateQueryDto,
  ) {
    return this.clientService.getDepotPack(depotId, user.id, user.role, query.date);
  }
}
