import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListClustersQueryDto {
  @ApiPropertyOptional({ description: "Only clusters in this region cuid" })
  @IsOptional()
  @IsString()
  regionId?: string;
}
