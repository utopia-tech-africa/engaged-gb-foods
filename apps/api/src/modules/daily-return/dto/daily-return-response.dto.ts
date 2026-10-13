import { ApiProperty } from "@nestjs/swagger";

export class DailyReturnRegionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

export class DailyReturnSubmitterDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  role!: string;
}

export class DailyReturnResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  regionId!: string;

  @ApiProperty({ type: String, format: "date-time" })
  date!: string;

  @ApiProperty({ type: String, format: "date-time" })
  submittedAt!: string;

  @ApiProperty()
  submittedByUserId!: string;

  @ApiProperty()
  coverageSummary!: string;

  @ApiProperty()
  stockStatusSummary!: string;

  @ApiProperty({ type: String, nullable: true })
  variancesSummary!: string | null;

  @ApiProperty({ type: String, nullable: true })
  incidentsSummary!: string | null;

  @ApiProperty()
  depotsPlanned!: number;

  @ApiProperty()
  depotsCompleted!: number;

  @ApiProperty()
  depotsException!: number;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: string;

  @ApiProperty({ type: DailyReturnRegionDto })
  region!: DailyReturnRegionDto;

  @ApiProperty({ type: DailyReturnSubmitterDto })
  submittedBy!: DailyReturnSubmitterDto;
}

export class DailyReturnTotalsDto {
  @ApiProperty()
  depotsPlanned!: number;

  @ApiProperty()
  depotsCompleted!: number;

  @ApiProperty()
  depotsException!: number;
}

export class NationalSummaryRowDto {
  @ApiProperty({ type: DailyReturnRegionDto })
  region!: DailyReturnRegionDto;

  @ApiProperty()
  submitted!: boolean;

  @ApiProperty({ type: DailyReturnResponseDto, nullable: true })
  return!: DailyReturnResponseDto | null;
}

export class NationalSummaryResponseDto {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  regionsSubmitted!: number;

  @ApiProperty()
  regionsTotal!: number;

  @ApiProperty({ type: DailyReturnTotalsDto })
  totals!: DailyReturnTotalsDto;

  @ApiProperty({ type: [NationalSummaryRowDto] })
  returns!: NationalSummaryRowDto[];
}
