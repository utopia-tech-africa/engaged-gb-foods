import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";

export class ClientDateQueryDto {
  @ApiPropertyOptional({ description: "Calendar date (UTC day)", example: "2026-10-12" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
