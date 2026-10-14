import { ApiPropertyOptional } from "@nestjs/swagger";
import { DispatchStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class ListDispatchesQueryDto {
  @ApiPropertyOptional({ description: "Filter by calendar day (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: "Filter by cluster id" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  clusterId?: string;

  @ApiPropertyOptional({ enum: DispatchStatus, enumName: "DispatchStatus" })
  @IsOptional()
  @IsEnum(DispatchStatus)
  status?: DispatchStatus;
}
