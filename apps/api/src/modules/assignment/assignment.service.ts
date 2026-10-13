import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Depot, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { activeAssignmentWhere, depotScopeFromAssignments } from "./assignment-depots.helper";
import type { AssignmentResponseDto } from "./dto/assignment-response.dto";
import type { CreateAssignmentDto } from "./dto/create-assignment.dto";
import type { UpdateAssignmentDto } from "./dto/update-assignment.dto";

export type AssignmentWithRelations = Prisma.AssignmentGetPayload<{
  include: {
    user: { select: { id: true; fullName: true; staffId: true; role: true } };
    distributor: { select: { id: true; name: true; code: true } };
    cluster: { select: { id: true; name: true; code: true } };
    region: { select: { id: true; name: true; code: true } };
  };
}>;

const assignmentInclude = {
  user: { select: { id: true, fullName: true, staffId: true, role: true } },
  distributor: { select: { id: true, name: true, code: true } },
  cluster: { select: { id: true, name: true, code: true } },
  region: { select: { id: true, name: true, code: true } },
} satisfies Prisma.AssignmentInclude;

const toAssignmentResponse = (assignment: AssignmentWithRelations): AssignmentResponseDto => ({
  ...assignment,
  effectiveFrom: assignment.effectiveFrom.toISOString(),
  effectiveTo: assignment.effectiveTo?.toISOString() ?? null,
  createdAt: assignment.createdAt.toISOString(),
  updatedAt: assignment.updatedAt.toISOString(),
});

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

  async listAssignments(userId?: string): Promise<AssignmentResponseDto[]> {
    const assignments = await this.prisma.assignment.findMany({
      where: userId ? { userId } : undefined,
      orderBy: [{ effectiveFrom: "desc" }],
      include: assignmentInclude,
    });
    return assignments.map(toAssignmentResponse);
  }

  async endAssignment(id: string, dto: UpdateAssignmentDto): Promise<AssignmentResponseDto> {
    const existing = await this.prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Assignment not found");
    }

    const effectiveTo = dto.effectiveTo ?? new Date();
    if (effectiveTo < existing.effectiveFrom) {
      throw new BadRequestException("effectiveTo cannot be before effectiveFrom");
    }

    const updated = await this.prisma.assignment.update({
      where: { id },
      data: { effectiveTo },
      include: assignmentInclude,
    });
    return toAssignmentResponse(updated);
  }

  async createAssignment(dto: CreateAssignmentDto): Promise<AssignmentResponseDto> {
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

    if (dto.effectiveTo && dto.effectiveTo < effectiveFrom) {
      throw new BadRequestException("effectiveTo cannot be before effectiveFrom");
    }

    const created = await this.prisma.assignment.create({
      include: assignmentInclude,
      data: {
        userId: dto.userId,
        distributorId: dto.distributorId ?? null,
        clusterId: dto.clusterId ?? null,
        regionId: dto.regionId ?? null,
        effectiveFrom,
        effectiveTo: dto.effectiveTo ?? null,
      },
    });
    return toAssignmentResponse(created);
  }
}
