import { ApiProperty } from "@nestjs/swagger";

export class MyDepotResponseDto {
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

  @ApiProperty()
  isActive!: boolean;
}
