import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RecceDecision } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

import { RecceChecklistDto } from "./recce-checklist.dto";
import { RecceGapInputDto } from "./recce-gap-input.dto";

export class CreateRecceDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  depotId!: string;

  @ApiProperty({ type: RecceChecklistDto })
  @ValidateNested()
  @Type(() => RecceChecklistDto)
  checklist!: RecceChecklistDto;

  @ApiProperty({ enum: RecceDecision })
  @IsEnum(RecceDecision)
  decision!: RecceDecision;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [RecceGapInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => RecceGapInputDto)
  gaps?: RecceGapInputDto[];

  @ApiPropertyOptional({
    type: [String],
    description: "R2 object keys of optional recce photos; capture time is stamped by the API",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  evidenceKeys?: string[];
}
