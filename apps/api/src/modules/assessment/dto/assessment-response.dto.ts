import { ApiProperty } from "@nestjs/swagger";
import { AssessmentResult, UserRole } from "@prisma/client";

export class AssessmentUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;

  @ApiProperty({ enum: UserRole, enumName: "UserRole" })
  role!: UserRole;
}

export class AssessmentAssessorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ enum: UserRole, enumName: "UserRole" })
  role!: UserRole;
}

export class AssessmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  safetyPass!: boolean;

  @ApiProperty()
  qualityPass!: boolean;

  @ApiProperty()
  recordsPass!: boolean;

  @ApiProperty({ enum: AssessmentResult, enumName: "AssessmentResult" })
  result!: AssessmentResult;

  @ApiProperty()
  dispatchable!: boolean;

  @ApiProperty({ type: String, nullable: true })
  notes!: string | null;

  @ApiProperty()
  assessedByUserId!: string;

  @ApiProperty({ type: String, format: "date-time" })
  assessedAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: string;

  @ApiProperty({ type: AssessmentUserDto })
  user!: AssessmentUserDto;

  @ApiProperty({ type: AssessmentAssessorDto })
  assessedBy!: AssessmentAssessorDto;
}
