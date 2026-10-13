import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EscalationTrigger } from "@prisma/client";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateEscalationDto {
  @ApiProperty({ description: "Depot the exception was found at" })
  @IsString()
  @MinLength(1)
  depotId!: string;

  @ApiPropertyOptional({ description: "Visit the exception belongs to, when known" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  visitId?: string;

  @ApiProperty({ enum: EscalationTrigger, enumName: "EscalationTrigger" })
  @IsEnum(EscalationTrigger)
  trigger!: EscalationTrigger;

  @ApiProperty({ description: "What happened, in the reporter's words" })
  @IsString()
  @MinLength(1)
  note!: string;

  @ApiPropertyOptional({
    type: [String],
    description: "Object keys of uploaded photos; capture time is stamped by the API",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  evidenceKeys?: string[];

  @ApiPropertyOptional({ description: "Person who owns the follow-up" })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
