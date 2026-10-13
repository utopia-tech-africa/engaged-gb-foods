import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DepotReadiness, RecceDecision } from "@prisma/client";

export class RecceChecklistResponseDto {
  @ApiProperty()
  access!: boolean;

  @ApiProperty()
  stockEstimate!: boolean;

  @ApiPropertyOptional()
  stockEstimateNote?: string;

  @ApiProperty()
  workspace!: boolean;

  @ApiProperty()
  power!: boolean;

  @ApiProperty()
  signal!: boolean;

  @ApiProperty()
  holdingZones!: boolean;
}

export class RecceGapResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  recceId!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  ownerName!: string;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  dueAt!: string | null;

  @ApiProperty()
  isCritical!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;
}

export class RecceEvidenceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  recceId!: string;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty({ type: String, format: "date-time" })
  capturedAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;
}

export class RecceDepotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: DepotReadiness, enumName: "DepotReadiness" })
  readiness!: DepotReadiness;
}

export class RecceAuthorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  role!: string;
}

export class RecceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  depotId!: string;

  @ApiProperty({ type: RecceChecklistResponseDto })
  checklist!: RecceChecklistResponseDto;

  @ApiProperty({ enum: RecceDecision, enumName: "RecceDecision" })
  decision!: RecceDecision;

  @ApiProperty({ type: String, nullable: true })
  notes!: string | null;

  @ApiProperty()
  authorUserId!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: string;

  @ApiProperty({ type: RecceDepotDto })
  depot!: RecceDepotDto;

  @ApiProperty({ type: RecceAuthorDto })
  author!: RecceAuthorDto;

  @ApiProperty({ type: [RecceGapResponseDto] })
  gaps!: RecceGapResponseDto[];

  @ApiProperty({ type: [RecceEvidenceResponseDto] })
  evidence!: RecceEvidenceResponseDto[];
}
