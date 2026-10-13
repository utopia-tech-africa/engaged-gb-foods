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
import { DistributorService } from "./distributor.service";
import { CreateDistributorDto } from "./dto/create-distributor.dto";
import { DistributorResponseDto } from "./dto/distributor-response.dto";
import { ListDistributorsQueryDto } from "./dto/list-distributors-query.dto";
import { UpdateDistributorDto } from "./dto/update-distributor.dto";

@ApiTags("Distributors")
@Controller("distributors")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DistributorController {
  constructor(
    @Inject(DistributorService) private readonly distributorService: DistributorService,
  ) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getDistributors",
    summary: "List distributors",
    description: "Returns distributors for the network register, optionally filtered by region id.",
  })
  @ApiOkResponse({ description: "List of distributors", type: [DistributorResponseDto] })
  getDistributors(@Query() query: ListDistributorsQueryDto) {
    return this.distributorService.listDistributors(query.regionId);
  }

  @Post()
  @Roles(...NETWORK_WRITE_ROLES)
  @ApiOperation({
    operationId: "postDistributors",
    summary: "Create distributor",
    description: "Creates a distributor under a region for national operations or admin users.",
  })
  @ApiCreatedResponse({ description: "Distributor created", type: DistributorResponseDto })
  postDistributors(@Body() body: CreateDistributorDto) {
    return this.distributorService.createDistributor(body);
  }

  @Patch(":id")
  @Roles(...NETWORK_WRITE_ROLES)
  @ApiOperation({
    operationId: "patchDistributors",
    summary: "Update distributor",
    description: "Updates distributor contact details, cluster link, or active flag.",
  })
  @ApiOkResponse({ description: "Distributor updated", type: DistributorResponseDto })
  patchDistributors(@Param("id") id: string, @Body() body: UpdateDistributorDto) {
    return this.distributorService.updateDistributor(id, body);
  }
}
