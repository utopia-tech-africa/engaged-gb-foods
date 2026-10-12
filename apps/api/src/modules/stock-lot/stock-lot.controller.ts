import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { FIELD_STOCK_WRITE_ROLES } from "../../common/constants/stock-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateStockLotDto } from "./dto/create-stock-lot.dto";
import { ListStockLotsQueryDto } from "./dto/list-stock-lots-query.dto";
import { StockLotService } from "./stock-lot.service";

@ApiTags("Stock lots")
@Controller("stock-lots")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StockLotController {
  constructor(@Inject(StockLotService) private readonly stockLotService: StockLotService) {}

  @Post()
  @Roles(...FIELD_STOCK_WRITE_ROLES)
  @ApiOperation({
    operationId: "postStockLots",
    summary: "Capture stock lot",
    description:
      "Creates a stock lot with evidence for a visit or today's visit at an assigned depot.",
  })
  @ApiCreatedResponse({ description: "Stock lot created" })
  postStockLots(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateStockLotDto) {
    return this.stockLotService.createStockLot(user.id, body);
  }

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getStockLots",
    summary: "List stock lots",
    description: "Lists stock lots filtered by visit, depot, and/or calendar date.",
  })
  @ApiOkResponse({ description: "Stock lot list" })
  getStockLots(@CurrentUser() user: AuthenticatedUser, @Query() query: ListStockLotsQueryDto) {
    return this.stockLotService.listStockLots(user.id, user.role, {
      visitId: query.visitId,
      depotId: query.depotId,
      date: query.date,
    });
  }

  @Get(":id")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getStockLotsById",
    summary: "Get stock lot",
    description: "Returns a single stock lot with SKU, evidence, and visit context.",
  })
  @ApiOkResponse({ description: "Stock lot detail" })
  getStockLotsById(@Param("id") id: string) {
    return this.stockLotService.getStockLotById(id);
  }
}
