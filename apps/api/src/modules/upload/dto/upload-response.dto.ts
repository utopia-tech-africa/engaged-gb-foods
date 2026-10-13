import { ApiProperty } from "@nestjs/swagger";

export class PresignedUploadResponseDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty({ enum: ["PUT"] })
  method!: "PUT";
}

export class LocalUploadResponseDto {
  @ApiProperty()
  objectKey!: string;
}
