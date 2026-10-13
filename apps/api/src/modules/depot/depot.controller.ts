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

import { NETWORK_READ_ROLES, NETWORK_WRITE_ROLES } from "../../common/constants/network-roles";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DepotService } from "./depot.service";
import { CreateDepotDto } from "./dto/create-depot.dto";
import { DepotResponseDto } from "./dto/depot-response.dto";
import { ListDepotsQueryDto } from "./dto/list-depots-query.dto";
import { UpdateDepotDto } from "./dto/update-depot.dto";

@ApiTags("Depots")
@Controller("depots")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DepotController {
  constructor(@Inject(DepotService) private readonly depotService: DepotService) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getDepots",
    summary: "List depots",
    description: "Returns depot register entries, optionally filtered by distributor or region id.",
  })
  @ApiOkResponse({ description: "List of depots", type: [DepotResponseDto] })
  getDepots(@Query() query: ListDepotsQueryDto) {
    return this.depotService.listDepots({
      distributorId: query.distributorId,
      regionId: query.regionId,
    });
  }

  @Get(":id")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getDepotsById",
    summary: "Get depot by id",
    description: "Returns a single depot including optional recce coordinates.",
  })
  @ApiOkResponse({ description: "Depot details", type: DepotResponseDto })
  getDepotsById(@Param("id") id: string) {
    return this.depotService.getDepotById(id);
  }

  @Post()
  @Roles(...NETWORK_WRITE_ROLES)
  @ApiOperation({
    operationId: "postDepots",
    summary: "Create depot",
    description:
      "Creates a depot under a distributor with address and optional recce pin coordinates.",
  })
  @ApiCreatedResponse({ description: "Depot created", type: DepotResponseDto })
  postDepots(@Body() body: CreateDepotDto) {
    return this.depotService.createDepot(body);
  }

  @Patch(":id")
  @Roles(...NETWORK_WRITE_ROLES)
  @ApiOperation({
    operationId: "patchDepots",
    summary: "Update depot",
    description: "Updates depot address, contacts, readiness, or recce coordinates.",
  })
  @ApiOkResponse({ description: "Depot updated", type: DepotResponseDto })
  patchDepots(@Param("id") id: string, @Body() body: UpdateDepotDto) {
    return this.depotService.updateDepot(id, body);
  }
}
