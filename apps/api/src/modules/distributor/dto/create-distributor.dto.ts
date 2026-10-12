import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateDistributorDto {
  @ApiProperty({ example: "Accra Fresh Distributors Ltd" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: "GA-ACC-01" })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiProperty({ description: "Region cuid" })
  @IsString()
  regionId!: string;

  @ApiPropertyOptional({ description: "Cluster cuid" })
  @IsOptional()
  @IsString()
  clusterId?: string;

  @ApiPropertyOptional({ example: "Ama Osei" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @ApiPropertyOptional({ example: "0244123456" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
