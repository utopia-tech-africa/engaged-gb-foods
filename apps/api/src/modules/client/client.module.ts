import { Module } from "@nestjs/common";

import { VisitModule } from "../visit/visit.module";
import { ClientController } from "./client.controller";
import { ClientService } from "./client.service";

@Module({
  imports: [VisitModule],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
