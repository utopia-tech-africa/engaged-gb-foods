import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "Ama Mensah" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ enum: UserRole, enumName: "UserRole" })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    example: "BTL-0031",
    description:
      "Optional for field roles. When omitted, the API assigns the next BTL-#### staff ID. Desk roles must not send this.",
  })
  @IsOptional()
  @IsString()
  @Length(3, 32)
  staffId?: string;

  @ApiPropertyOptional({ example: "ama@gbfoods.local", description: "Required for desk roles" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+233201234567" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({
    example: "2468",
    description: "Four to six digits. Required for field roles",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: "PIN must be 4 to 6 digits" })
  pin?: string;

  @ApiPropertyOptional({ description: "At least 8 characters. Required for desk roles" })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
