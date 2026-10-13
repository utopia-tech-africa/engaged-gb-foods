import { ApiProperty } from "@nestjs/swagger";

export class OpsDashboardKpisDto {
  @ApiProperty({ type: Number, description: "Active depots in the network." })
  depotsTotal!: number;

  @ApiProperty({ type: Number, description: "Active depots with readiness ready." })
  depotsReady!: number;

  @ApiProperty({ type: Number, description: "Active depots with readiness hold." })
  depotsHold!: number;

  @ApiProperty({ type: Number, description: "Visits scheduled for the day." })
  visitsScheduled!: number;

  @ApiProperty({ type: Number, description: "Visits in progress for the day." })
  visitsInProgress!: number;

  @ApiProperty({ type: Number, description: "Visits complete for the day." })
  visitsComplete!: number;

  @ApiProperty({ type: Number, description: "Visits flagged as exception for the day." })
  visitsException!: number;

  @ApiProperty({ type: Number, description: "Escalations that are open or in progress." })
  openEscalations!: number;

  @ApiProperty({
    type: Number,
    description: "Held or rejected lots from the day's visits that have no disposition yet.",
  })
  qualityHolds!: number;

  @ApiProperty({
    type: Number,
    description:
      "In-progress visits for the day that never synced or have not synced within the configured delay window.",
  })
  syncDelayedVisits!: number;

  @ApiProperty({
    type: Number,
    description: "Active users on field roles (QC, handler, cluster supervisor).",
  })
  activeFieldUsers!: number;

  @ApiProperty({
    type: Number,
    description: "Active field users whose latest assessment is a pass.",
  })
  dispatchableStaff!: number;
}

export class OpsVisitStatusCountDto {
  @ApiProperty({ type: String, example: "complete" })
  status!: string;

  @ApiProperty({ type: Number })
  count!: number;
}

export class OpsDepotReadinessCountDto {
  @ApiProperty({ type: String, example: "ready" })
  readiness!: string;

  @ApiProperty({ type: Number })
  count!: number;
}

export class OpsEscalationTriggerCountDto {
  @ApiProperty({ type: String, example: "count_mismatch" })
  trigger!: string;

  @ApiProperty({ type: Number })
  count!: number;
}

export class OpsAttendanceTodayDto {
  @ApiProperty({ type: Number })
  checkIns!: number;

  @ApiProperty({ type: Number })
  checkOuts!: number;
}

export class OpsStockZoneDto {
  @ApiProperty({ type: String, example: "held_or_rejected" })
  zone!: string;

  @ApiProperty({ type: Number, description: "Number of lots recorded in the zone." })
  lots!: number;

  @ApiProperty({ type: Number, description: "Total base-unit quantity in the zone." })
  baseQuantity!: number;
}

export class OpsRegionCoverageDto {
  @ApiProperty({ type: String })
  regionCode!: string;

  @ApiProperty({ type: String })
  regionName!: string;

  @ApiProperty({ type: Number, description: "Active depots in the region." })
  depots!: number;

  @ApiProperty({ type: Number, description: "Depots with a complete visit on the day." })
  complete!: number;

  @ApiProperty({ type: Number, description: "Depots with an exception visit on the day." })
  exception!: number;
}

export class OpsDailyReturnSubmissionDto {
  @ApiProperty({ type: Number })
  regionsSubmitted!: number;

  @ApiProperty({ type: Number })
  regionsTotal!: number;
}

export class OpsDashboardResponseDto {
  @ApiProperty({ type: String, example: "2026-10-13" })
  date!: string;

  @ApiProperty({ type: () => OpsDashboardKpisDto })
  kpis!: OpsDashboardKpisDto;

  @ApiProperty({ type: () => [OpsVisitStatusCountDto] })
  visitStatusChart!: OpsVisitStatusCountDto[];

  @ApiProperty({ type: () => [OpsDepotReadinessCountDto] })
  depotReadinessChart!: OpsDepotReadinessCountDto[];

  @ApiProperty({
    type: () => [OpsEscalationTriggerCountDto],
    description: "Open and in-progress escalations grouped by trigger.",
  })
  escalationByTrigger!: OpsEscalationTriggerCountDto[];

  @ApiProperty({ type: () => OpsAttendanceTodayDto })
  attendanceToday!: OpsAttendanceTodayDto;

  @ApiProperty({ type: () => [OpsStockZoneDto] })
  stockByZone!: OpsStockZoneDto[];

  @ApiProperty({ type: () => [OpsRegionCoverageDto] })
  regionCoverage!: OpsRegionCoverageDto[];

  @ApiProperty({ type: () => OpsDailyReturnSubmissionDto })
  dailyReturnSubmission!: OpsDailyReturnSubmissionDto;
}
