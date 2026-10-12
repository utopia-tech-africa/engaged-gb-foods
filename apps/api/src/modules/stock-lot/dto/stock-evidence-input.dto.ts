import { ApiProperty } from "@nestjs/swagger";
import { StockEvidenceCategory } from "@prisma/client";
import { IsEnum, IsString, MinLength } from "class-validator";

export class StockEvidenceInputDto {
  @ApiProperty({ enum: StockEvidenceCategory })
  @IsEnum(StockEvidenceCategory)
  category!: StockEvidenceCategory;

  @ApiProperty({ example: "stock_evidence/uuid.jpg" })
  @IsString()
  @MinLength(1)
  objectKey!: string;
}
