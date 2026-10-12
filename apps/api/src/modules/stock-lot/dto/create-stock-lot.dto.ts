import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StockUnit, StockZone } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";

import { StockEvidenceInputDto } from "./stock-evidence-input.dto";

export class CreateStockLotDto {
  @ApiPropertyOptional({ description: "Existing visit id when known" })
  @ValidateIf((dto: CreateStockLotDto) => !dto.depotId)
  @IsString()
  @MinLength(1)
  visitId?: string;

  @ApiPropertyOptional({
    description: "Depot id; resolves or creates today's visit for the current user",
  })
  @ValidateIf((dto: CreateStockLotDto) => !dto.visitId)
  @IsString()
  @MinLength(1)
  depotId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  skuId!: string;

  @ApiProperty({ example: "LOT-2026-0412" })
  @IsString()
  @MinLength(1)
  batchCode!: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ enum: StockZone })
  @IsEnum(StockZone)
  zone!: StockZone;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ enum: StockUnit })
  @IsEnum(StockUnit)
  unit!: StockUnit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracyMeters?: number;

  @ApiProperty({ type: [StockEvidenceInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockEvidenceInputDto)
  evidence!: StockEvidenceInputDto[];
}
