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

import {
  ESCALATION_FIELD_WRITE_ROLES,
  ESCALATION_OPS_WRITE_ROLES,
} from "../../common/constants/escalation-roles";
import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateEscalationDto } from "./dto/create-escalation.dto";
import { EscalationResponseDto } from "./dto/escalation-response.dto";
import { ListEscalationsQueryDto } from "./dto/list-escalations-query.dto";
import { UpdateEscalationDto } from "./dto/update-escalation.dto";
import { EscalationService } from "./escalation.service";

@ApiTags("Escalations")
@Controller("escalations")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EscalationController {
  constructor(@Inject(EscalationService) private readonly escalationService: EscalationService) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getEscalations",
    summary: "List escalations",
    description:
      "Lists field exceptions raised as escalations, newest first, optionally filtered by depot, visit, and status.",
  })
  @ApiOkResponse({ description: "Escalation list", type: [EscalationResponseDto] })
  getEscalations(@Query() query: ListEscalationsQueryDto) {
    return this.escalationService.list(query);
  }

  @Get(":id")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getEscalationsById",
    summary: "Get escalation by id",
    description: "Returns a single escalation with depot, reporter, and photo evidence.",
  })
  @ApiOkResponse({ description: "Escalation detail", type: EscalationResponseDto })
  getEscalationsById(@Param("id") id: string) {
    return this.escalationService.getById(id);
  }

  @Post()
  @Roles(...ESCALATION_FIELD_WRITE_ROLES)
  @ApiOperation({
    operationId: "postEscalations",
    summary: "Raise escalation",
    description:
      "Records a field exception with a trigger, note, and photos. The visit status is not changed, so the field can still reconcile.",
  })
  @ApiCreatedResponse({ description: "Escalation created", type: EscalationResponseDto })
  postEscalations(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateEscalationDto) {
    return this.escalationService.create(user.id, body);
  }

  @Patch(":id")
  @Roles(...ESCALATION_OPS_WRITE_ROLES)
  @ApiOperation({
    operationId: "patchEscalationsById",
    summary: "Update escalation",
    description:
      "Updates status, owner, due date, or written record. Moving to resolved stamps the resolution time; moving back clears it.",
  })
  @ApiOkResponse({ description: "Escalation updated", type: EscalationResponseDto })
  patchEscalationsById(@Param("id") id: string, @Body() body: UpdateEscalationDto) {
    return this.escalationService.update(id, body);
  }
}
