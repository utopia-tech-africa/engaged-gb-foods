import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateSkuDto {
  @ApiProperty({ example: "Gino Tomato Mix" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: "Gino" })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 24, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  packFactor?: number;

  @ApiProperty({ example: "case" })
  @IsString()
  @MinLength(1)
  caseUnit!: string;

  @ApiProperty({ example: "sachet" })
  @IsString()
  @MinLength(1)
  looseUnit!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
