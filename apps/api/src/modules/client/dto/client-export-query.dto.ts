import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";

export class ClientExportQueryDto {
  @ApiPropertyOptional({ description: "Calendar date (UTC day)", example: "2026-10-12" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ApiPropertyOptional({ description: "Filter by region id" })
  @IsOptional()
  @IsString()
  regionId?: string;
}
