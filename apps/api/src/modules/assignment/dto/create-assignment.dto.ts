import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString } from "class-validator";

export class CreateAssignmentDto {
  @ApiProperty({ description: "User cuid (typically a QC)" })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({ description: "Distributor cuid" })
  @IsOptional()
  @IsString()
  distributorId?: string;

  @ApiPropertyOptional({ description: "Cluster cuid" })
  @IsOptional()
  @IsString()
  clusterId?: string;

  @ApiPropertyOptional({ description: "Region cuid" })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiPropertyOptional({ description: "Defaults to now when omitted" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date;
}
