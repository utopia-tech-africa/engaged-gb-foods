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

import { DAILY_RETURN_WRITE_ROLES } from "../../common/constants/daily-return-roles";
import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DailyReturnService } from "./daily-return.service";
import { CreateDailyReturnDto } from "./dto/create-daily-return.dto";
import {
  DailyReturnResponseDto,
  NationalSummaryResponseDto,
} from "./dto/daily-return-response.dto";
import { ListDailyReturnsQueryDto } from "./dto/list-daily-returns-query.dto";
import { NationalSummaryQueryDto } from "./dto/national-summary-query.dto";
import { UpdateDailyReturnDto } from "./dto/update-daily-return.dto";

@ApiTags("Daily returns")
@Controller("daily-returns")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DailyReturnController {
  constructor(
    @Inject(DailyReturnService) private readonly dailyReturnService: DailyReturnService,
  ) {}

  @Get()
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getDailyReturns",
    summary: "List daily returns",
    description:
      "Lists regional daily returns, newest first, optionally filtered by region and by a single day.",
  })
  @ApiOkResponse({ description: "Daily return list", type: [DailyReturnResponseDto] })
  getDailyReturns(@Query() query: ListDailyReturnsQueryDto) {
    return this.dailyReturnService.list({ regionId: query.regionId, date: query.date });
  }

  @Get("national/summary")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getDailyReturnsNationalSummary",
    summary: "National daily return summary",
    description:
      "Aggregates the regional daily returns for a day: how many active regions have submitted, national depot totals, and a per-region breakdown including regions still outstanding.",
  })
  @ApiOkResponse({ description: "National summary for the day", type: NationalSummaryResponseDto })
  getDailyReturnsNationalSummary(@Query() query: NationalSummaryQueryDto) {
    return this.dailyReturnService.nationalSummary(query.date);
  }

  @Get(":id")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getDailyReturnsById",
    summary: "Get daily return by id",
    description: "Returns a single regional daily return with region and submitter.",
  })
  @ApiOkResponse({ description: "Daily return detail", type: DailyReturnResponseDto })
  getDailyReturnsById(@Param("id") id: string) {
    return this.dailyReturnService.getById(id);
  }

  @Post()
  @Roles(...DAILY_RETURN_WRITE_ROLES)
  @ApiOperation({
    operationId: "postDailyReturns",
    summary: "Submit daily return",
    description:
      "Submits the daily return for a region and date. If one already exists for that region and date it is updated instead (upsert). Depot counts not supplied are derived from active depots and that day's visits in the region.",
  })
  @ApiCreatedResponse({
    description: "Daily return created or updated",
    type: DailyReturnResponseDto,
  })
  postDailyReturns(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateDailyReturnDto) {
    return this.dailyReturnService.submit(user.id, body);
  }

  @Patch(":id")
  @Roles(...DAILY_RETURN_WRITE_ROLES)
  @ApiOperation({
    operationId: "patchDailyReturnsById",
    summary: "Update daily return",
    description:
      "Updates summaries or depot counts on an existing daily return. Region and date cannot change.",
  })
  @ApiOkResponse({ description: "Daily return updated", type: DailyReturnResponseDto })
  patchDailyReturnsById(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: UpdateDailyReturnDto,
  ) {
    return this.dailyReturnService.update(id, user.id, body);
  }
}
