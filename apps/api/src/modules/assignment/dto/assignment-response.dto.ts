import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

export class AssignmentUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;

  @ApiProperty({ enum: UserRole, enumName: "UserRole" })
  role!: UserRole;
}

export class AssignmentScopeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;
}

export class AssignmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ type: String, nullable: true })
  distributorId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  clusterId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  regionId!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  effectiveFrom!: string;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  effectiveTo!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: string;

  @ApiProperty({ type: AssignmentUserDto })
  user!: AssignmentUserDto;

  @ApiProperty({ type: AssignmentScopeDto, nullable: true })
  distributor!: AssignmentScopeDto | null;

  @ApiProperty({ type: AssignmentScopeDto, nullable: true })
  cluster!: AssignmentScopeDto | null;

  @ApiProperty({ type: AssignmentScopeDto, nullable: true })
  region!: AssignmentScopeDto | null;
}
