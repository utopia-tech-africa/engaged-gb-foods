import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({ description: "Opaque refresh token returned at sign-in" })
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
