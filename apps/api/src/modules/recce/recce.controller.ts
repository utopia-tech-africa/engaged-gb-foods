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

import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { READINESS_WRITE_ROLES } from "../../common/constants/readiness-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateRecceDto } from "./dto/create-recce.dto";
import { ListRecceQueryDto } from "./dto/list-recces-query.dto";
import { RecceResponseDto } from "./dto/recce-response.dto";
import { UpdateRecceDto } from "./dto/update-recce.dto";
import { RecceService } from "./recce.service";

@ApiTags("Recces")
@Controller("recces")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RecceController {
  constructor(@Inject(RecceService) private readonly recceService: RecceService) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getRecces",
    summary: "List recces",
    description:
      "Lists depot recces with gaps and evidence, newest first, optionally filtered by depot or decision.",
  })
  @ApiOkResponse({ description: "Recce list", type: [RecceResponseDto] })
  getRecces(@Query() query: ListRecceQueryDto) {
    return this.recceService.listRecces({ depotId: query.depotId, decision: query.decision });
  }

  @Get(":id")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getReccesById",
    summary: "Get recce by id",
    description: "Returns a single recce with checklist, gaps, evidence, depot, and author.",
  })
  @ApiOkResponse({ description: "Recce detail", type: RecceResponseDto })
  getReccesById(@Param("id") id: string) {
    return this.recceService.getRecceById(id);
  }

  @Post()
  @Roles(...READINESS_WRITE_ROLES)
  @ApiOperation({
    operationId: "postRecces",
    summary: "Create recce",
    description:
      "Records a depot recce with checklist, gaps, and optional photo keys. A critical gap forces a hold decision. The depot readiness is synced to the latest recce decision.",
  })
  @ApiCreatedResponse({ description: "Recce created", type: RecceResponseDto })
  postRecces(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateRecceDto) {
    return this.recceService.createRecce(user.id, body);
  }

  @Patch(":id")
  @Roles(...READINESS_WRITE_ROLES)
  @ApiOperation({
    operationId: "patchReccesById",
    summary: "Update recce",
    description:
      "Updates checklist, decision, notes, or replaces gaps and evidence. A critical gap still forces a hold decision. The depot readiness is re-synced to its latest recce.",
  })
  @ApiOkResponse({ description: "Recce updated", type: RecceResponseDto })
  patchReccesById(@Param("id") id: string, @Body() body: UpdateRecceDto) {
    return this.recceService.updateRecce(id, body);
  }
}
