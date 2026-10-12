import { Module } from "@nestjs/common";

import { R2Config } from "./r2.config";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";

@Module({
  controllers: [UploadController],
  providers: [R2Config, UploadService],
  exports: [UploadService, R2Config],
})
export class UploadModule {}
