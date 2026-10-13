import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  email!: string | null;

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: UserRole, enumName: "UserRole" })
  role!: UserRole;

  @ApiProperty()
  isActive!: boolean;
}

export class AuthTokenResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 900, description: "Access token lifetime in seconds" })
  expiresIn!: number;
}
