import { Module } from "@nestjs/common";

import { UploadModule } from "../upload/upload.module";
import { EscalationController } from "./escalation.controller";
import { EscalationService } from "./escalation.service";

@Module({
  imports: [UploadModule],
  controllers: [EscalationController],
  providers: [EscalationService],
})
export class EscalationModule {}
