import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class ListAttendanceQueryDto {
  @ApiPropertyOptional({ description: "Filter by depot id" })
  @IsOptional()
  @IsString()
  depotId?: string;

  @ApiProperty({ description: "Calendar date (YYYY-MM-DD)", example: "2026-10-12" })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: "Filter by user id" })
  @IsOptional()
  @IsString()
  userId?: string;
}
