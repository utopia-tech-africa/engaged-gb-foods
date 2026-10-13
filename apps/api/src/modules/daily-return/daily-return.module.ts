import { Module } from "@nestjs/common";

import { DailyReturnController } from "./daily-return.controller";
import { DailyReturnService } from "./daily-return.service";

@Module({
  controllers: [DailyReturnController],
  providers: [DailyReturnService],
})
export class DailyReturnModule {}
