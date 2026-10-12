import { Inject, Injectable } from "@nestjs/common";
import type { Sku } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type { CreateSkuDto } from "./dto/create-sku.dto";

@Injectable()
export class SkuService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  listSkus(): Promise<Sku[]> {
    return this.prisma.sku.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }],
    });
  }

  createSku(dto: CreateSkuDto): Promise<Sku> {
    return this.prisma.sku.create({
      data: {
        name: dto.name.trim(),
        brand: dto.brand?.trim() ?? null,
        packFactor: dto.packFactor ?? 1,
        caseUnit: dto.caseUnit.trim(),
        looseUnit: dto.looseUnit.trim(),
        isActive: dto.isActive ?? true,
      },
    });
  }
}
