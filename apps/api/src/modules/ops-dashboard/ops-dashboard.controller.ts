import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OpsDashboardQueryDto } from "./dto/ops-dashboard-query.dto";
import { OpsDashboardResponseDto } from "./dto/ops-dashboard-response.dto";
import { OPS_DASHBOARD_ROLES } from "./ops-dashboard.constants";
import { OpsDashboardService } from "./ops-dashboard.service";

@ApiTags("Ops dashboard")
@Controller("ops/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OpsDashboardController {
  constructor(
    @Inject(OpsDashboardService) private readonly opsDashboardService: OpsDashboardService,
  ) {}

  @Get()
  @Roles(...OPS_DASHBOARD_ROLES)
  @ApiOperation({
    operationId: "getOpsDashboard",
    summary: "Get ops dashboard stats",
    description:
      "Returns network-wide KPIs and chart data for one day: depot readiness, visit progress, escalations, quality holds, attendance, stock by zone, region coverage and daily return submission.",
  })
  @ApiOkResponse({ description: "Dashboard stats for the day", type: OpsDashboardResponseDto })
  getOpsDashboard(@Query() query: OpsDashboardQueryDto) {
    return this.opsDashboardService.getDashboard(query.date);
  }
}
