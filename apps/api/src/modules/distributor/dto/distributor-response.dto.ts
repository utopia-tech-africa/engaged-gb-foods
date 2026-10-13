import { ApiProperty } from "@nestjs/swagger";

export class DistributorResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  regionId!: string;

  @ApiProperty({ type: String, nullable: true })
  clusterId!: string | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ type: String, nullable: true })
  contactName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  contactPhone!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: string;
}
