import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RegionResponseDto } from "./dto/region-response.dto";
import { RegionService } from "./region.service";

@ApiTags("Regions")
@Controller("regions")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RegionController {
  constructor(@Inject(RegionService) private readonly regionService: RegionService) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getRegions",
    summary: "List regions",
    description: "Returns Ghana network regions ordered by name for ops and field users.",
  })
  @ApiOkResponse({ description: "List of regions", type: [RegionResponseDto] })
  getRegions() {
    return this.regionService.listRegions();
  }
}
