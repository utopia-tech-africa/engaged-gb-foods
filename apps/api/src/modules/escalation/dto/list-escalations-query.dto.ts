import { ApiPropertyOptional } from "@nestjs/swagger";
import { EscalationStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListEscalationsQueryDto {
  @ApiPropertyOptional({ description: "Filter by depot id" })
  @IsOptional()
  @IsString()
  depotId?: string;

  @ApiPropertyOptional({ description: "Filter by visit id" })
  @IsOptional()
  @IsString()
  visitId?: string;

  @ApiPropertyOptional({ enum: EscalationStatus, enumName: "EscalationStatus" })
  @IsOptional()
  @IsEnum(EscalationStatus)
  status?: EscalationStatus;
}
