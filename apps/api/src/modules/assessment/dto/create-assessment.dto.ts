import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class CreateAssessmentDto {
  @ApiProperty({ description: "Field user being assessed (qc, handler, or cluster_supervisor)" })
  @IsString()
  @MinLength(1)
  userId!: string;

  @ApiProperty({ description: "Mandatory safety step passed" })
  @IsBoolean()
  safetyPass!: boolean;

  @ApiProperty({ description: "Mandatory quality step passed" })
  @IsBoolean()
  qualityPass!: boolean;

  @ApiProperty({ description: "Mandatory record-keeping step passed" })
  @IsBoolean()
  recordsPass!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
