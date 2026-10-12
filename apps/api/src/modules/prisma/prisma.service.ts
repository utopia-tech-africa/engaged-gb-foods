import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch {
      // Allow the API process to boot before Postgres is available (local scaffold).
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
