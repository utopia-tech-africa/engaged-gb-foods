import { Module } from "@nestjs/common";

import { RecceController } from "./recce.controller";
import { RecceService } from "./recce.service";

@Module({
  controllers: [RecceController],
  providers: [RecceService],
})
export class RecceModule {}
