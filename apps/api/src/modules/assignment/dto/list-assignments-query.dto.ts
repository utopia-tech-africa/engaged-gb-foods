import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListAssignmentsQueryDto {
  @ApiPropertyOptional({ description: "Only assignments for this user cuid" })
  @IsOptional()
  @IsString()
  userId?: string;
}
