import { ApiProperty } from "@nestjs/swagger";
import { DispositionDecision } from "@prisma/client";
import { IsEnum, IsString, MinLength } from "class-validator";

export class CreateDispositionDto {
  @ApiProperty({ enum: DispositionDecision })
  @IsEnum(DispositionDecision)
  decision!: DispositionDecision;

  @ApiProperty({ example: "Meets release criteria after QC review" })
  @IsString()
  @MinLength(1)
  reason!: string;
}
