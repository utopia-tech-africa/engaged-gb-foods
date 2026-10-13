import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class ListDailyReturnsQueryDto {
  @ApiPropertyOptional({ description: "Filter by region id" })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiPropertyOptional({ example: "2026-10-13", description: "Only returns for this day" })
  @IsOptional()
  @IsDateString()
  date?: string;
}
