import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

/** User profile for ops screens. Never includes PIN or password hashes. */
export class UserResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  email!: string | null;

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: UserRole, enumName: "UserRole" })
  role!: UserRole;

  @ApiProperty({ type: Boolean })
  isActive!: boolean;

  @ApiProperty({ type: Boolean, description: "True when a field PIN has been set" })
  hasPin!: boolean;

  @ApiProperty({ type: Boolean, description: "True when a desk password has been set" })
  hasPassword!: boolean;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  lockedAt!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: string;
}
