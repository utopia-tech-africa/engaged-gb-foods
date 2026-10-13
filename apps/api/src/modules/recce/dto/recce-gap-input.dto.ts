import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from "class-validator";

export class RecceGapInputDto {
  @ApiProperty({ example: "Loading bay gate is locked after 17:00" })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({ example: "Depot manager" })
  @IsString()
  @MinLength(1)
  ownerName!: string;

  @ApiPropertyOptional({ example: "2026-10-20" })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiProperty({ description: "A critical access or safety gap blocks a ready decision" })
  @IsBoolean()
  isCritical!: boolean;
}
