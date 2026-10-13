import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsOptional } from "class-validator";

export class UpdateAssignmentDto {
  @ApiPropertyOptional({
    description: "End date for the assignment. Defaults to now when omitted.",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date;
}
