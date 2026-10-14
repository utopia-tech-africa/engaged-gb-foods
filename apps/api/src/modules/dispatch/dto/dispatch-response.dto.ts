import { ApiProperty } from "@nestjs/swagger";
import { DispatchStatus } from "@prisma/client";

export class DispatchClusterDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  regionId!: string;
}

export class DispatchUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;

  @ApiProperty()
  role!: string;
}

export class DispatchDepotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  readiness!: string;

  @ApiProperty()
  distributorId!: string;

  @ApiProperty()
  distributorName!: string;
}

export class DispatchVisitSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  status!: string;
}

export class DispatchSlotResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  dispatchDayId!: string;

  @ApiProperty()
  depotId!: string;

  @ApiProperty()
  qcUserId!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: String, nullable: true })
  visitId!: string | null;

  @ApiProperty({ type: DispatchDepotDto })
  depot!: DispatchDepotDto;

  @ApiProperty({ type: DispatchUserDto })
  qcUser!: DispatchUserDto;

  @ApiProperty({ type: DispatchVisitSummaryDto, nullable: true })
  visit!: DispatchVisitSummaryDto | null;
}

export class DispatchDayResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  clusterId!: string;

  @ApiProperty({ type: String, format: "date-time" })
  date!: string;

  @ApiProperty({ enum: DispatchStatus, enumName: "DispatchStatus" })
  status!: DispatchStatus;

  @ApiProperty({ type: String, nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  frozenAt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  frozenByUserId!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: string;

  @ApiProperty({ type: DispatchClusterDto })
  cluster!: DispatchClusterDto;

  @ApiProperty({ type: DispatchUserDto })
  createdBy!: DispatchUserDto;

  @ApiProperty({ type: DispatchUserDto, nullable: true })
  frozenBy!: DispatchUserDto | null;

  @ApiProperty({ type: [DispatchSlotResponseDto] })
  slots!: DispatchSlotResponseDto[];
}

export class DispatchCandidateQcDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;

  @ApiProperty()
  dispatchable!: boolean;
}

export class DispatchCandidateResponseDto {
  @ApiProperty({ type: DispatchDepotDto })
  depot!: DispatchDepotDto;

  @ApiProperty({
    type: DispatchCandidateQcDto,
    nullable: true,
    description: "Suggested QC for this depot, or null if none is dispatchable",
  })
  suggestedQc!: DispatchCandidateQcDto | null;

  @ApiProperty({ type: [DispatchCandidateQcDto] })
  eligibleQcs!: DispatchCandidateQcDto[];

  @ApiProperty({ description: "True when this depot is already on another plan for the day" })
  alreadyPlanned!: boolean;

  @ApiProperty({ type: String, nullable: true })
  blockReason!: string | null;
}
