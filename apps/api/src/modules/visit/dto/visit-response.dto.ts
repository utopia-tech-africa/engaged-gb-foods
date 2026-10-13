import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SignatureRole } from "@prisma/client";

export class VisitDepotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

export class VisitQcUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: String, nullable: true })
  staffId!: string | null;
}

export class VisitSignatureResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  visitId!: string;

  @ApiProperty({ enum: SignatureRole, enumName: "SignatureRole" })
  role!: SignatureRole;

  @ApiProperty()
  signerName!: string;

  @ApiProperty({ type: String, nullable: true })
  imageObjectKey!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  signedAt!: string;

  @ApiProperty({ type: String, nullable: true })
  signedByUserId!: string | null;
}

export class VisitSummaryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ type: String, format: "date-time" })
  date!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  reconciledAt!: string | null;

  @ApiProperty({ type: VisitDepotDto })
  depot!: VisitDepotDto;

  @ApiProperty({ type: VisitQcUserDto })
  qcUser!: VisitQcUserDto;

  @ApiPropertyOptional({ type: [VisitSignatureResponseDto] })
  signatures?: VisitSignatureResponseDto[];
}

export class ReconciliationLineDto {
  @ApiProperty()
  skuId!: string;

  @ApiProperty()
  batchCode!: string;

  @ApiProperty()
  skuName!: string;

  @ApiProperty()
  opening!: number;

  @ApiProperty()
  inward!: number;

  @ApiProperty()
  outward!: number;

  @ApiProperty({ type: "object", additionalProperties: { type: "number" } })
  closingByZone!: Record<string, number>;

  @ApiProperty()
  closingTotal!: number;

  @ApiProperty()
  variance!: number;

  @ApiProperty({ type: [String] })
  lotIds!: string[];
}

export class HeldLotWithoutCustodianDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  skuId!: string;

  @ApiProperty()
  batchCode!: string;

  @ApiProperty()
  skuName!: string;

  @ApiProperty()
  baseQuantity!: number;
}

export class ReconciliationSnapshotResponseDto {
  @ApiProperty({ type: VisitSummaryResponseDto })
  visit!: VisitSummaryResponseDto;

  @ApiProperty({ type: [ReconciliationLineDto] })
  lines!: ReconciliationLineDto[];

  @ApiProperty({ type: [HeldLotWithoutCustodianDto] })
  heldLotsWithoutCustodian!: HeldLotWithoutCustodianDto[];

  @ApiProperty({ type: [VisitSignatureResponseDto] })
  signatures!: VisitSignatureResponseDto[];

  @ApiProperty({ enum: SignatureRole, enumName: "SignatureRole", isArray: true })
  missingSignatures!: SignatureRole[];

  @ApiProperty()
  canClose!: boolean;
}
