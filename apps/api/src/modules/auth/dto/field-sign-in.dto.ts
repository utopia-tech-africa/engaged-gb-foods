import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";

export class FieldSignInDto {
  @ApiProperty({ example: "BTL-0031", description: "Staff ID printed on the field photo ID card" })
  @IsString()
  @Length(3, 32)
  staffId!: string;

  @ApiProperty({ example: "2468", description: "Four to six digit PIN" })
  @IsString()
  @Matches(/^\d{4,6}$/)
  pin!: string;
}
