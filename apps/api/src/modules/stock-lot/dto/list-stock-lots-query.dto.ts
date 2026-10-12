import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MinLength } from "class-validator";

export class ListStockLotsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  visitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  depotId?: string;

  @ApiPropertyOptional({ example: "2026-10-12" })
  @IsOptional()
  @IsDateString()
  date?: string;
}
