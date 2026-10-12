import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListDistributorsQueryDto {
  @ApiPropertyOptional({ description: "Filter by region id" })
  @IsOptional()
  @IsString()
  regionId?: string;
}
