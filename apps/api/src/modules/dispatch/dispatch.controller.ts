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

import { DISPATCH_WRITE_ROLES } from "../../common/constants/dispatch-roles";
import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DispatchService } from "./dispatch.service";
import { CreateDispatchDto } from "./dto/create-dispatch.dto";
import { DispatchCandidateResponseDto, DispatchDayResponseDto } from "./dto/dispatch-response.dto";
import { ListDispatchCandidatesQueryDto } from "./dto/list-dispatch-candidates-query.dto";
import { ListDispatchesQueryDto } from "./dto/list-dispatches-query.dto";
import { UpdateDispatchDto } from "./dto/update-dispatch.dto";

@ApiTags("Dispatches")
@Controller("dispatches")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DispatchController {
  constructor(@Inject(DispatchService) private readonly dispatchService: DispatchService) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getDispatches",
    summary: "List dispatch days",
    description:
      "Lists next-day route plans per cluster, optionally filtered by date, cluster, and draft/frozen status.",
  })
  @ApiOkResponse({ description: "Dispatch day list", type: [DispatchDayResponseDto] })
  getDispatches(@Query() query: ListDispatchesQueryDto) {
    return this.dispatchService.list(query);
  }

  @Get("candidates")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getDispatchesCandidates",
    summary: "List dispatch candidates",
    description:
      "Returns depots in a cluster with suggested dispatchable QCs for a visit day. Depots on hold or without a passed assessment are returned with a block reason.",
  })
  @ApiOkResponse({
    description: "Candidate depots for the cluster and day",
    type: [DispatchCandidateResponseDto],
  })
  getDispatchesCandidates(@Query() query: ListDispatchCandidatesQueryDto) {
    return this.dispatchService.listCandidates(query);
  }

  @Get(":id")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getDispatchesById",
    summary: "Get dispatch day by id",
    description: "Returns a dispatch plan with cluster, slots, QC, and linked visits after freeze.",
  })
  @ApiOkResponse({ description: "Dispatch day detail", type: DispatchDayResponseDto })
  getDispatchesById(@Param("id") id: string) {
    return this.dispatchService.getById(id);
  }

  @Post()
  @Roles(...DISPATCH_WRITE_ROLES)
  @ApiOperation({
    operationId: "postDispatches",
    summary: "Create draft dispatch",
    description:
      "Creates a draft route for a cluster and date. Depots must be recce-ready and QCs must have a passing assessment and an active assignment covering the depot.",
  })
  @ApiCreatedResponse({ description: "Draft dispatch created", type: DispatchDayResponseDto })
  postDispatches(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateDispatchDto) {
    return this.dispatchService.create(user.id, body);
  }

  @Patch(":id")
  @Roles(...DISPATCH_WRITE_ROLES)
  @ApiOperation({
    operationId: "patchDispatchesById",
    summary: "Update draft dispatch",
    description: "Replaces notes and/or slots on a draft dispatch. Frozen plans cannot be edited.",
  })
  @ApiOkResponse({ description: "Draft dispatch updated", type: DispatchDayResponseDto })
  patchDispatchesById(@Param("id") id: string, @Body() body: UpdateDispatchDto) {
    return this.dispatchService.update(id, body);
  }

  @Post(":id/freeze")
  @Roles(...DISPATCH_WRITE_ROLES)
  @ApiOperation({
    operationId: "postDispatchesByIdFreeze",
    summary: "Freeze dispatch route",
    description:
      "Locks the plan for the day and creates scheduled Visit rows for each slot. After freeze, depots cannot be added or removed.",
  })
  @ApiOkResponse({
    description: "Dispatch frozen with scheduled visits",
    type: DispatchDayResponseDto,
  })
  postDispatchesByIdFreeze(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.dispatchService.freeze(id, user.id);
  }
}
