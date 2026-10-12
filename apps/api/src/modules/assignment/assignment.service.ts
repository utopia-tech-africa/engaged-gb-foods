import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Assignment, Depot, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { activeAssignmentWhere, depotScopeFromAssignments } from "./assignment-depots.helper";
import type { CreateAssignmentDto } from "./dto/create-assignment.dto";

export type AssignmentWithRelations = Prisma.AssignmentGetPayload<{
  include: {
    user: { select: { id: true; fullName: true; staffId: true; role: true } };
    distributor: { select: { id: true; name: true; code: true } };
    cluster: { select: { id: true; name: true; code: true } };
    region: { select: { id: true; name: true; code: true } };
  };
}>;

@Injectable()
export class AssignmentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listDepotsForUser(userId: string): Promise<Depot[]> {
    const assignments = await this.prisma.assignment.findMany({
      where: activeAssignmentWhere(userId, new Date()),
    });
    const scope = depotScopeFromAssignments(assignments);
    if (!scope) {
      return [];
    }

    return this.prisma.depot.findMany({
      where: scope,
      orderBy: [{ name: "asc" }],
    });
  }

  async listAssignments(): Promise<AssignmentWithRelations[]> {
    return this.prisma.assignment.findMany({
      orderBy: [{ effectiveFrom: "desc" }],
      include: {
        user: { select: { id: true, fullName: true, staffId: true, role: true } },
        distributor: { select: { id: true, name: true, code: true } },
        cluster: { select: { id: true, name: true, code: true } },
        region: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async createAssignment(dto: CreateAssignmentDto): Promise<Assignment> {
    const scopeCount = [dto.distributorId, dto.clusterId, dto.regionId].filter(Boolean).length;
    if (scopeCount !== 1) {
      throw new BadRequestException("Provide exactly one of distributorId, clusterId, or regionId");
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (dto.distributorId) {
      const distributor = await this.prisma.distributor.findUnique({
        where: { id: dto.distributorId },
      });
      if (!distributor) {
        throw new BadRequestException("Distributor not found");
      }
    }

    if (dto.clusterId) {
      const cluster = await this.prisma.cluster.findUnique({ where: { id: dto.clusterId } });
      if (!cluster) {
        throw new BadRequestException("Cluster not found");
      }
    }

    if (dto.regionId) {
      const region = await this.prisma.region.findUnique({ where: { id: dto.regionId } });
      if (!region) {
        throw new BadRequestException("Region not found");
      }
    }

    const effectiveFrom = dto.effectiveFrom ?? new Date();

    return this.prisma.assignment.create({
      data: {
        userId: dto.userId,
        distributorId: dto.distributorId ?? null,
        clusterId: dto.clusterId ?? null,
        regionId: dto.regionId ?? null,
        effectiveFrom,
        effectiveTo: dto.effectiveTo ?? null,
      },
    });
  }
}
