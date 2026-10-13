import { ApiPropertyOptional } from "@nestjs/swagger";
import { RecceDecision } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListRecceQueryDto {
  @ApiPropertyOptional({ description: "Filter by depot id" })
  @IsOptional()
  @IsString()
  depotId?: string;

  @ApiPropertyOptional({
    enum: RecceDecision,
    enumName: "RecceDecision",
    description: "Filter by decision",
  })
  @IsOptional()
  @IsEnum(RecceDecision)
  decision?: RecceDecision;
}
