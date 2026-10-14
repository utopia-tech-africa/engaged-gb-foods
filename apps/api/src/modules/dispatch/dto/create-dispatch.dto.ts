import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CreateDispatchSlotDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  depotId!: string;

  @ApiProperty({ description: "QC person assigned to this depot for the day" })
  @IsString()
  @MinLength(1)
  qcUserId!: string;

  @ApiPropertyOptional({ description: "Display order within the cluster route" })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateDispatchDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  clusterId!: string;

  @ApiProperty({ description: "Visit day (YYYY-MM-DD)" })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateDispatchSlotDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDispatchSlotDto)
  slots!: CreateDispatchSlotDto[];
}
