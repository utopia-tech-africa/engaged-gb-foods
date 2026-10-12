import { Inject, Injectable } from "@nestjs/common";
import type { Region } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RegionService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listRegions(): Promise<Region[]> {
    return this.prisma.region.findMany({
      orderBy: { name: "asc" },
    });
  }
}
