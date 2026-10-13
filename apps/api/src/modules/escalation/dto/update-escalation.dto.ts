import { ApiPropertyOptional } from "@nestjs/swagger";
import { EscalationStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateEscalationDto {
  @ApiPropertyOptional({ enum: EscalationStatus, enumName: "EscalationStatus" })
  @IsOptional()
  @IsEnum(EscalationStatus)
  status?: EscalationStatus;

  @ApiPropertyOptional({ description: "Owner of the follow-up. An empty string clears it." })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional({ type: String, format: "date-time", description: "Follow-up due date" })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ description: "Written record of the resolution or decision" })
  @IsOptional()
  @IsString()
  writtenRecord?: string;
}
