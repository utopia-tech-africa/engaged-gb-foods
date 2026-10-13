import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/environment";
import { AssessmentModule } from "./modules/assessment/assessment.module";
import { AssignmentModule } from "./modules/assignment/assignment.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClientModule } from "./modules/client/client.module";
import { DepotModule } from "./modules/depot/depot.module";
import { DistributorModule } from "./modules/distributor/distributor.module";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { RecceModule } from "./modules/recce/recce.module";
import { RegionModule } from "./modules/region/region.module";
import { SkuModule } from "./modules/sku/sku.module";
import { StockLotModule } from "./modules/stock-lot/stock-lot.module";
import { UploadModule } from "./modules/upload/upload.module";
import { UserModule } from "./modules/user/user.module";
import { VisitModule } from "./modules/visit/visit.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ClientModule,
    RegionModule,
    DistributorModule,
    DepotModule,
    AssignmentModule,
    UploadModule,
    AttendanceModule,
    SkuModule,
    StockLotModule,
    VisitModule,
    RecceModule,
    AssessmentModule,
    UserModule,
  ],
})
export class AppModule {}
