import { ApiProperty } from "@nestjs/swagger";
import { StockEvidenceCategory, StockUnit, StockZone } from "@prisma/client";

import { SkuResponseDto } from "../../sku/dto/sku-response.dto";

export class StockEvidenceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: StockEvidenceCategory, enumName: "StockEvidenceCategory" })
  category!: StockEvidenceCategory;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty({ type: String, format: "date-time" })
  capturedAt!: string;
}

export class StockLotDepotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

export class StockLotVisitDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ type: String, format: "date-time" })
  date!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: StockLotDepotDto })
  depot!: StockLotDepotDto;
}

export class StockLotCreatorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;

  @ApiProperty()
  role!: string;
}

export class StockLotResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  visitId!: string;

  @ApiProperty()
  skuId!: string;

  @ApiProperty()
  batchCode!: string;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  expiryDate!: string | null;

  @ApiProperty({ enum: StockZone, enumName: "StockZone" })
  zone!: StockZone;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ enum: StockUnit, enumName: "StockUnit" })
  unit!: StockUnit;

  @ApiProperty()
  baseQuantity!: number;

  @ApiProperty({ type: String, nullable: true })
  custodian!: string | null;

  @ApiProperty({ type: String, nullable: true })
  notes!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  latitude!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  longitude!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  accuracyMeters!: number | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: SkuResponseDto })
  sku!: SkuResponseDto;

  @ApiProperty({ type: [StockEvidenceResponseDto] })
  evidence!: StockEvidenceResponseDto[];

  @ApiProperty({ type: StockLotVisitDto })
  visit!: StockLotVisitDto;

  @ApiProperty({ type: StockLotCreatorDto })
  createdBy!: StockLotCreatorDto;
}
