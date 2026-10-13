import { ApiPropertyOptional } from "@nestjs/swagger";
import { AssessmentResult } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class ListAssessmentsQueryDto {
  @ApiPropertyOptional({ description: "Filter by assessed user id" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: AssessmentResult, description: "Filter by result" })
  @IsOptional()
  @IsEnum(AssessmentResult)
  result?: AssessmentResult;

  @ApiPropertyOptional({
    description: "Return every assessment instead of only the latest per user",
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  @IsBoolean()
  history?: boolean;
}
