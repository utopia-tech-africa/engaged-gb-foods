import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";

export class OpsDashboardQueryDto {
  @ApiPropertyOptional({
    type: String,
    example: "2026-10-13",
    description: "Day to report on (YYYY-MM-DD). Defaults to today (UTC).",
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
