import { ApiProperty } from "@nestjs/swagger";
import { EscalationStatus, EscalationTrigger } from "@prisma/client";

export class EscalationEvidenceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty({ type: String, format: "date-time" })
  capturedAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;
}

export class EscalationDepotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

export class EscalationReporterDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  role!: string;
}

export class EscalationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  visitId!: string | null;

  @ApiProperty()
  depotId!: string;

  @ApiProperty({ enum: EscalationTrigger, enumName: "EscalationTrigger" })
  trigger!: EscalationTrigger;

  @ApiProperty({ enum: EscalationStatus, enumName: "EscalationStatus" })
  status!: EscalationStatus;

  @ApiProperty()
  note!: string;

  @ApiProperty({ type: String, nullable: true })
  ownerName!: string | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  dueAt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  writtenRecord!: string | null;

  @ApiProperty()
  reportedByUserId!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: string;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  resolvedAt!: string | null;

  @ApiProperty({ type: EscalationDepotDto })
  depot!: EscalationDepotDto;

  @ApiProperty({ type: EscalationReporterDto })
  reportedBy!: EscalationReporterDto;

  @ApiProperty({ type: [EscalationEvidenceResponseDto] })
  evidence!: EscalationEvidenceResponseDto[];
}
