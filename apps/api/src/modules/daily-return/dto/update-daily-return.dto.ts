import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class UpdateDailyReturnDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  coverageSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  stockStatusSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variancesSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  incidentsSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  depotsPlanned?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  depotsCompleted?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  depotsException?: number;
}
