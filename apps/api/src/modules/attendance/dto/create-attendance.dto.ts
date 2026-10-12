import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AttendanceKind } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateAttendanceDto {
  @ApiProperty({ description: "Depot cuid" })
  @IsString()
  depotId!: string;

  @ApiProperty({ enum: AttendanceKind })
  @IsEnum(AttendanceKind)
  kind!: AttendanceKind;

  @ApiProperty({ example: "local/abc.jpg or attendance/uuid.jpg" })
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  photoObjectKey!: string;

  @ApiPropertyOptional({ description: "GPS latitude when available" })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: "GPS longitude when available" })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: "GPS accuracy in meters when available" })
  @IsOptional()
  @IsNumber()
  accuracyMeters?: number;
}
