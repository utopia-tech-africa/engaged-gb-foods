import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Matches } from "class-validator";

export class ClientOverviewQueryDto {
  @ApiPropertyOptional({ description: "Calendar date (UTC day)", example: "2026-10-12" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ApiPropertyOptional({ description: "Filter depots by region id" })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiPropertyOptional({ description: "Filter depots by depot id" })
  @IsOptional()
  @IsString()
  depotId?: string;

  @ApiPropertyOptional({
    enum: ["pending", "hold", "reviewed"],
    description: "Filter depot rows by GBfoods review status",
  })
  @IsOptional()
  @IsIn(["pending", "hold", "reviewed"])
  reviewStatus?: "pending" | "hold" | "reviewed";
}
