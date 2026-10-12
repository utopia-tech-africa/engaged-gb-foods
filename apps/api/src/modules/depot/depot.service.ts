import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Depot, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type { CreateDepotDto } from "./dto/create-depot.dto";
import type { UpdateDepotDto } from "./dto/update-depot.dto";

@Injectable()
export class DepotService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listDepots(filters: { distributorId?: string; regionId?: string }): Promise<Depot[]> {
    const where: Prisma.DepotWhereInput = {};

    if (filters.distributorId) {
      where.distributorId = filters.distributorId;
    }

    if (filters.regionId) {
      where.distributor = { regionId: filters.regionId };
    }

    return this.prisma.depot.findMany({
      where,
      orderBy: [{ distributorId: "asc" }, { name: "asc" }],
    });
  }

  async getDepotById(id: string): Promise<Depot> {
    const depot = await this.prisma.depot.findUnique({ where: { id } });
    if (!depot) {
      throw new NotFoundException("Depot not found");
    }
    return depot;
  }

  async createDepot(dto: CreateDepotDto): Promise<Depot> {
    const distributor = await this.prisma.distributor.findUnique({
      where: { id: dto.distributorId },
    });
    if (!distributor) {
      throw new BadRequestException("Distributor not found");
    }

    const code = dto.code.trim().toUpperCase();

    return this.prisma.depot.create({
      data: {
        distributorId: dto.distributorId,
        code,
        name: dto.name.trim(),
        address: dto.address.trim(),
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        contactName: dto.contactName?.trim() ?? null,
        contactPhone: dto.contactPhone?.trim() ?? null,
        openingHours: dto.openingHours?.trim() ?? null,
        readiness: dto.readiness ?? "unknown",
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateDepot(id: string, dto: UpdateDepotDto): Promise<Depot> {
    const existing = await this.prisma.depot.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Depot not found");
    }

    return this.prisma.depot.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        address: dto.address?.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        openingHours: dto.openingHours,
        readiness: dto.readiness,
        isActive: dto.isActive,
      },
    });
  }
}
