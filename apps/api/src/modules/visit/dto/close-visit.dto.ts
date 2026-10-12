import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

export class VisitOpenActionInputDto {
  @ApiProperty({ example: "Re-count batch LOT-12 in bay 3" })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({ example: "Cluster supervisor" })
  @IsString()
  @MinLength(1)
  ownerName!: string;

  @ApiPropertyOptional({ example: "2026-10-15" })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  acceptedByGBfoods?: boolean;
}

export class CloseVisitDto {
  @ApiPropertyOptional({
    description: "When provided, closes the visit as exception with tracked open actions",
    type: [VisitOpenActionInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VisitOpenActionInputDto)
  openActions?: VisitOpenActionInputDto[];
}
