import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListDepotsQueryDto {
  @ApiPropertyOptional({ description: "Filter by distributor id" })
  @IsOptional()
  @IsString()
  distributorId?: string;

  @ApiPropertyOptional({ description: "Filter by region id (via distributor)" })
  @IsOptional()
  @IsString()
  regionId?: string;
}
