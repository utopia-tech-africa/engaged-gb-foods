import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsString, Max, Min } from "class-validator";

export enum UploadPurpose {
  attendance_photo = "attendance_photo",
  stock_evidence = "stock_evidence",
}

const MAX_ATTENDANCE_PHOTO_BYTES = 5 * 1024 * 1024;

export class PresignUploadDto {
  @ApiProperty({ example: "image/jpeg" })
  @IsString()
  contentType!: string;

  @ApiProperty({ example: 120_000, maximum: MAX_ATTENDANCE_PHOTO_BYTES })
  @IsInt()
  @Min(1)
  @Max(MAX_ATTENDANCE_PHOTO_BYTES)
  contentLength!: number;

  @ApiProperty({ enum: UploadPurpose })
  @IsEnum(UploadPurpose)
  purpose!: UploadPurpose;
}

export { MAX_ATTENDANCE_PHOTO_BYTES };
