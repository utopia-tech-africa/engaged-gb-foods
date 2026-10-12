import { ApiPropertyOptional } from "@nestjs/swagger";
import { VisitStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export class ListVisitsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  depotId?: string;

  @ApiPropertyOptional({ example: "2026-10-12" })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: VisitStatus })
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;
}
