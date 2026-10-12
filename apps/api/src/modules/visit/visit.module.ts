import { Module } from "@nestjs/common";

import { UploadModule } from "../upload/upload.module";
import { VisitController } from "./visit.controller";
import { VisitService } from "./visit.service";

@Module({
  imports: [UploadModule],
  controllers: [VisitController],
  providers: [VisitService],
  exports: [VisitService],
})
export class VisitModule {}
