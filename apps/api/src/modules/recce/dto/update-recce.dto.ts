import { ApiPropertyOptional } from "@nestjs/swagger";
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

export class UpdateRecceDto {
  @ApiPropertyOptional({ type: RecceChecklistDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecceChecklistDto)
  checklist?: RecceChecklistDto;

  @ApiPropertyOptional({ enum: RecceDecision })
  @IsOptional()
  @IsEnum(RecceDecision)
  decision?: RecceDecision;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [RecceGapInputDto],
    description: "When provided, replaces all existing gaps",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => RecceGapInputDto)
  gaps?: RecceGapInputDto[];

  @ApiPropertyOptional({
    type: [String],
    description: "When provided, replaces evidence; existing keys keep their capture time",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  evidenceKeys?: string[];
}
