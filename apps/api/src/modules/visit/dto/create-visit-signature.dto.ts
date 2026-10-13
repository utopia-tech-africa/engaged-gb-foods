import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SignatureRole } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class CreateVisitSignatureDto {
  @ApiProperty({ enum: SignatureRole, enumName: "SignatureRole" })
  @IsEnum(SignatureRole)
  role!: SignatureRole;

  @ApiProperty({ example: "Ama Mensah" })
  @IsString()
  @MinLength(1)
  signerName!: string;

  @ApiPropertyOptional({ description: "Drawn signature image object key from uploads" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  imageObjectKey?: string;
}
