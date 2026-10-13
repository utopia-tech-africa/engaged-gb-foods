import { ApiProperty } from "@nestjs/swagger";
import { DepotReadiness } from "@prisma/client";

export class DepotResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  distributorId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty({ type: Number, nullable: true })
  latitude!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  longitude!: number | null;

  @ApiProperty({ type: String, nullable: true })
  contactName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  contactPhone!: string | null;

  @ApiProperty({ type: String, nullable: true })
  openingHours!: string | null;

  @ApiProperty({ enum: DepotReadiness, enumName: "DepotReadiness" })
  readiness!: DepotReadiness;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: string;
}
