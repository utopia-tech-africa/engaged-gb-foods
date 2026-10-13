import { ApiProperty } from "@nestjs/swagger";

export class SkuResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  brand!: string | null;

  @ApiProperty()
  packFactor!: number;

  @ApiProperty()
  caseUnit!: string;

  @ApiProperty()
  looseUnit!: string;

  @ApiProperty()
  isActive!: boolean;
}
