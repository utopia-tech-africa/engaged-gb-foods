import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

export class UserSummaryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;

  @ApiProperty({ enum: UserRole, enumName: "UserRole" })
  role!: UserRole;

  @ApiProperty()
  isActive!: boolean;
}
