import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/environment";
import { AssignmentModule } from "./modules/assignment/assignment.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DepotModule } from "./modules/depot/depot.module";
import { DistributorModule } from "./modules/distributor/distributor.module";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { RegionModule } from "./modules/region/region.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    RegionModule,
    DistributorModule,
    DepotModule,
    AssignmentModule,
  ],
})
export class AppModule {}
