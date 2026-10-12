import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class PatchStockLotCustodianDto {
  @ApiProperty({ example: "Depot storekeeper · Kwame" })
  @IsString()
  @MinLength(1)
  custodian!: string;
}
