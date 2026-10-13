import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ClusterService } from "./cluster.service";
import { ClusterResponseDto } from "./dto/cluster-response.dto";
import { ListClustersQueryDto } from "./dto/list-clusters-query.dto";

@ApiTags("Clusters")
@Controller("clusters")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClusterController {
  constructor(@Inject(ClusterService) private readonly clusterService: ClusterService) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getClusters",
    summary: "List clusters",
    description: "Returns clusters ordered by name, optionally filtered by region.",
  })
  @ApiOkResponse({ description: "List of clusters", type: [ClusterResponseDto] })
  getClusters(@Query() query: ListClustersQueryDto) {
    return this.clusterService.listClusters(query.regionId);
  }
}
