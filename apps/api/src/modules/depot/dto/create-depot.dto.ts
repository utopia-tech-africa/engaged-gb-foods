import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DepotReadiness } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateDepotDto {
  @ApiProperty({ description: "Distributor cuid" })
  @IsString()
  distributorId!: string;

  @ApiProperty({ example: "GA-ACC-D01" })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiProperty({ example: "Tema Main Depot" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: "12 Industrial Area, Tema" })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address!: string;

  @ApiPropertyOptional({ description: "Optional recce latitude (no geofence)" })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: "Optional recce longitude (no geofence)" })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @ApiPropertyOptional({ example: "Mon–Sat 08:00–17:00" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  openingHours?: string;

  @ApiPropertyOptional({ enum: DepotReadiness, enumName: "DepotReadiness" })
  @IsOptional()
  @IsEnum(DepotReadiness)
  readiness?: DepotReadiness;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
