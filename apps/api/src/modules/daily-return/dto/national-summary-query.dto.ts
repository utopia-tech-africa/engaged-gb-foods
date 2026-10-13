import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";

export class NationalSummaryQueryDto {
  @ApiPropertyOptional({ example: "2026-10-13", description: "Defaults to today (UTC)" })
  @IsOptional()
  @IsDateString()
  date?: string;
}
