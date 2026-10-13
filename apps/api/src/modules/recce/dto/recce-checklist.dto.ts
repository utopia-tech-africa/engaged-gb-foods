import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class RecceChecklistDto {
  @ApiProperty({ description: "Vehicle and staff access is safe and workable" })
  @IsBoolean()
  access!: boolean;

  @ApiProperty({ description: "Stock volume has been estimated" })
  @IsBoolean()
  stockEstimate!: boolean;

  @ApiPropertyOptional({ example: "About 400 cases, mostly Gino tomato mix" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  stockEstimateNote?: string;

  @ApiProperty({ description: "Workspace for sorting is available" })
  @IsBoolean()
  workspace!: boolean;

  @ApiProperty({ description: "Power is available on site" })
  @IsBoolean()
  power!: boolean;

  @ApiProperty({ description: "Mobile signal is adequate" })
  @IsBoolean()
  signal!: boolean;

  @ApiProperty({ description: "Holding zones can be set up" })
  @IsBoolean()
  holdingZones!: boolean;
}
