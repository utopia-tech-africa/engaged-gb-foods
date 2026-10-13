import { ApiProperty } from "@nestjs/swagger";

export class ClusterResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  regionId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  supervisorUserId!: string | null;
}
