import { ApiProperty } from "@nestjs/swagger";

import { StockLotResponseDto } from "../../stock-lot/dto/stock-lot-response.dto";
import { ReconciliationSnapshotResponseDto } from "../../visit/dto/visit-response.dto";

export enum ClientReviewStatusValue {
  pending = "pending",
  hold = "hold",
  reviewed = "reviewed",
}

export class ClientOverviewDepotDto {
  @ApiProperty()
  depotId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  regionName!: string;

  @ApiProperty({ type: String, nullable: true })
  visitStatus!: string | null;

  @ApiProperty()
  coverage!: number;

  @ApiProperty({ enum: ClientReviewStatusValue, enumName: "ClientReviewStatus" })
  reviewStatus!: ClientReviewStatusValue;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  lastSyncedAt!: string | null;

  @ApiProperty()
  openHolds!: number;
}

export class ClientOverviewResponseDto {
  @ApiProperty()
  date!: string;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  lastSyncAt!: string | null;

  @ApiProperty()
  depotsComplete!: number;

  @ApiProperty()
  depotsTotal!: number;

  @ApiProperty()
  recordsToReview!: number;

  @ApiProperty()
  qualityHolds!: number;

  @ApiProperty()
  depotsWithSyncDelay!: number;

  @ApiProperty({ type: [ClientOverviewDepotDto] })
  depots!: ClientOverviewDepotDto[];
}

export class ClientPackDepotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  regionName!: string;
}

export class ClientPackVisitDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  lastSyncedAt!: string | null;
}

export class ClientPackHoldDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  visitCode!: string;

  @ApiProperty()
  skuName!: string;

  @ApiProperty()
  batchCode!: string;

  @ApiProperty()
  baseQuantity!: number;

  @ApiProperty({ type: String, nullable: true })
  custodian!: string | null;

  @ApiProperty()
  pendingDisposition!: boolean;
}

export class ClientDepotPackResponseDto {
  @ApiProperty()
  date!: string;

  @ApiProperty({ type: ClientPackDepotDto })
  depot!: ClientPackDepotDto;

  @ApiProperty({ type: [ClientPackVisitDto] })
  visits!: ClientPackVisitDto[];

  @ApiProperty({ type: [ReconciliationSnapshotResponseDto] })
  reconciliations!: ReconciliationSnapshotResponseDto[];

  @ApiProperty({ type: [StockLotResponseDto] })
  lots!: StockLotResponseDto[];

  @ApiProperty({ type: [ClientPackHoldDto] })
  holds!: ClientPackHoldDto[];
}
