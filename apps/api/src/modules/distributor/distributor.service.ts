import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Distributor, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type { CreateDistributorDto } from "./dto/create-distributor.dto";
import type { UpdateDistributorDto } from "./dto/update-distributor.dto";

@Injectable()
export class DistributorService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listDistributors(regionId?: string): Promise<Distributor[]> {
    const where: Prisma.DistributorWhereInput = regionId ? { regionId } : {};
    return this.prisma.distributor.findMany({
      where,
      orderBy: [{ regionId: "asc" }, { name: "asc" }],
    });
  }

  async createDistributor(dto: CreateDistributorDto): Promise<Distributor> {
    await this.assertRegionExists(dto.regionId);
    if (dto.clusterId) {
      await this.assertClusterInRegion(dto.clusterId, dto.regionId);
    }

    const code = dto.code.trim().toUpperCase();

    return this.prisma.distributor.create({
      data: {
        name: dto.name.trim(),
        code,
        regionId: dto.regionId,
        clusterId: dto.clusterId ?? null,
        contactName: dto.contactName?.trim() ?? null,
        contactPhone: dto.contactPhone?.trim() ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateDistributor(id: string, dto: UpdateDistributorDto): Promise<Distributor> {
    const existing = await this.prisma.distributor.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Distributor not found");
    }

    const regionId = dto.regionId ?? existing.regionId;
    if (dto.regionId) {
      await this.assertRegionExists(dto.regionId);
    }

    if (dto.clusterId !== undefined && dto.clusterId !== null) {
      await this.assertClusterInRegion(dto.clusterId, regionId);
    }

    return this.prisma.distributor.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        regionId: dto.regionId,
        clusterId: dto.clusterId,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        isActive: dto.isActive,
      },
    });
  }

  private async assertRegionExists(regionId: string): Promise<void> {
    const region = await this.prisma.region.findUnique({ where: { id: regionId } });
    if (!region) {
      throw new BadRequestException("Region not found");
    }
  }

  private async assertClusterInRegion(clusterId: string, regionId: string): Promise<void> {
    const cluster = await this.prisma.cluster.findFirst({
      where: { id: clusterId, regionId },
    });
    if (!cluster) {
      throw new BadRequestException("Cluster not found in the selected region");
    }
  }
}
