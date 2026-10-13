import { ApiProperty } from "@nestjs/swagger";
import { AttendanceKind } from "@prisma/client";

export class AttendanceUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;

  @ApiProperty()
  role!: string;
}

export class AttendanceDepotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

export class AttendanceVisitDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  status!: string;
}

export class AttendanceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  visitId!: string | null;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  depotId!: string;

  @ApiProperty({ enum: AttendanceKind, enumName: "AttendanceKind" })
  kind!: AttendanceKind;

  @ApiProperty()
  photoObjectKey!: string;

  @ApiProperty({ type: Number, nullable: true })
  latitude!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  longitude!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  accuracyMeters!: number | null;

  @ApiProperty({ type: String, format: "date-time" })
  capturedAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: AttendanceUserDto })
  user!: AttendanceUserDto;

  @ApiProperty({ type: AttendanceDepotDto })
  depot!: AttendanceDepotDto;

  @ApiProperty({ type: AttendanceVisitDto, nullable: true })
  visit!: AttendanceVisitDto | null;
}
