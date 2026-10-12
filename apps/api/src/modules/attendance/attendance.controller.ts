import { Body, Controller, Get, Inject, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import {
  ATTENDANCE_READ_ROLES,
  FIELD_ATTENDANCE_WRITE_ROLES,
} from "../../common/constants/attendance-roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AttendanceService } from "./attendance.service";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { ListAttendanceQueryDto } from "./dto/list-attendance-query.dto";

@ApiTags("Attendance")
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(@Inject(AttendanceService) private readonly attendanceService: AttendanceService) {}

  @Post("attendance")
  @Roles(...FIELD_ATTENDANCE_WRITE_ROLES)
  @ApiOperation({
    operationId: "postAttendance",
    summary: "Record check-in or check-out",
    description:
      "Stores attendance with photo object key and optional GPS coordinates. Missing GPS is allowed.",
  })
  @ApiCreatedResponse({ description: "Attendance recorded" })
  postAttendance(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAttendanceDto) {
    return this.attendanceService.createAttendance(user.id, body);
  }

  @Get("attendance")
  @Roles(...ATTENDANCE_READ_ROLES)
  @ApiOperation({
    operationId: "getAttendance",
    summary: "List attendance records",
    description:
      "Supervisors and ops can list attendance for a calendar date with optional filters.",
  })
  @ApiOkResponse({ description: "Attendance list" })
  getAttendance(@Query() query: ListAttendanceQueryDto) {
    return this.attendanceService.listAttendance({
      depotId: query.depotId,
      userId: query.userId,
      date: query.date,
    });
  }

  @Get("me/attendance/today")
  @Roles(...FIELD_ATTENDANCE_WRITE_ROLES)
  @ApiOperation({
    operationId: "getMeAttendanceToday",
    summary: "My attendance today",
    description: "Returns the signed-in field user's attendance events for the current UTC day.",
  })
  @ApiOkResponse({ description: "Today's attendance for current user" })
  getMeAttendanceToday(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.listMyAttendanceToday(user.id);
  }
}
