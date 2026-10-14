import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({
    description: "Rejected. Staff IDs are assigned on create and cannot be changed.",
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @Length(3, 32)
  staffId?: string;

  @ApiPropertyOptional({ description: "Desk roles only; cannot be cleared" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Send an empty string to clear the phone number" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: "2468",
    description: "Resets the field PIN, clears the lock and failed attempts",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: "PIN must be 4 to 6 digits" })
  pin?: string;

  @ApiPropertyOptional({ description: "Resets the desk password (at least 8 characters)" })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;
}
