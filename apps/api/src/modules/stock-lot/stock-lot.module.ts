import { Module } from "@nestjs/common";

import { UploadModule } from "../upload/upload.module";
import { StockLotController } from "./stock-lot.controller";
import { StockLotService } from "./stock-lot.service";

@Module({
  imports: [UploadModule],
  controllers: [StockLotController],
  providers: [StockLotService],
})
export class StockLotModule {}
