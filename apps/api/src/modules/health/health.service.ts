import { Injectable } from "@nestjs/common";

import type { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<{ status: "ok"; service: string; database: "up" | "down" }> {
    let database: "up" | "down" = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }

    return {
      status: "ok",
      service: "gbfoods-stock-control-api",
      database,
    };
  }
}
