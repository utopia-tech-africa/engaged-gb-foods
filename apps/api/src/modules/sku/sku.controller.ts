import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { SKU_WRITE_ROLES } from "../../common/constants/stock-roles";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateSkuDto } from "./dto/create-sku.dto";
import { SkuService } from "./sku.service";

@ApiTags("Skus")
@Controller("skus")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SkuController {
  constructor(@Inject(SkuService) private readonly skuService: SkuService) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getSkus",
    summary: "List SKUs",
    description: "Returns active product SKUs for stock capture and ops.",
  })
  @ApiOkResponse({ description: "SKU list" })
  getSkus() {
    return this.skuService.listSkus();
  }

  @Post()
  @Roles(...SKU_WRITE_ROLES)
  @ApiOperation({
    operationId: "postSkus",
    summary: "Create SKU",
    description: "Creates a product SKU. Restricted to admin and national ops.",
  })
  @ApiCreatedResponse({ description: "SKU created" })
  postSkus(@Body() body: CreateSkuDto) {
    return this.skuService.createSku(body);
  }
}
