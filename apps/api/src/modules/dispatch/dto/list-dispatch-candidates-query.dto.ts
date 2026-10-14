import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MinLength } from "class-validator";

export class ListDispatchCandidatesQueryDto {
  @ApiProperty({ description: "Visit day to plan (YYYY-MM-DD)" })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: "Cluster to plan within" })
  @IsString()
  @MinLength(1)
  clusterId!: string;

  @ApiPropertyOptional({
    description: "When set, exclude depots already on this draft (for editing)",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  excludeDispatchId?: string;
}
