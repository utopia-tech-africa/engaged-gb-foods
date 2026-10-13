import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateDailyReturnDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  regionId!: string;

  @ApiProperty({ example: "2026-10-13" })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: "Depot coverage summary for the day" })
  @IsString()
  @MinLength(1)
  coverageSummary!: string;

  @ApiProperty({ description: "Stock status summary for the day" })
  @IsString()
  @MinLength(1)
  stockStatusSummary!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variancesSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  incidentsSummary?: string;

  @ApiPropertyOptional({ description: "Defaults to the active depots in the region" })
  @IsOptional()
  @IsInt()
  @Min(0)
  depotsPlanned?: number;

  @ApiPropertyOptional({ description: "Defaults to complete visits in the region that day" })
  @IsOptional()
  @IsInt()
  @Min(0)
  depotsCompleted?: number;

  @ApiPropertyOptional({ description: "Defaults to exception visits in the region that day" })
  @IsOptional()
  @IsInt()
  @Min(0)
  depotsException?: number;
}
