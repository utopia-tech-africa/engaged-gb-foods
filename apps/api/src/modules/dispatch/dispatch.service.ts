import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AssessmentResult,
  DepotReadiness,
  DispatchStatus,
  type Prisma,
  UserRole,
  VisitStatus,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type { CreateDispatchDto, CreateDispatchSlotDto } from "./dto/create-dispatch.dto";
import type { UpdateDispatchDto } from "./dto/update-dispatch.dto";

const activeAtWhere = (at: Date): Prisma.AssignmentWhereInput => ({
  effectiveFrom: { lte: at },
  OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
});

const userSelect = {
  id: true,
  fullName: true,
  staffId: true,
  role: true,
} satisfies Prisma.UserSelect;

const dispatchInclude = {
  cluster: { select: { id: true, code: true, name: true, regionId: true } },
  createdBy: { select: userSelect },
  frozenBy: { select: userSelect },
  slots: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      depot: {
        select: {
          id: true,
          code: true,
          name: true,
          readiness: true,
          distributorId: true,
          distributor: { select: { name: true } },
        },
      },
      qcUser: { select: userSelect },
      visit: { select: { id: true, code: true, status: true } },
    },
  },
} satisfies Prisma.DispatchDayInclude;

const parseDay = (value: string): Date => new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

const formatVisitDate = (day: Date): string => day.toISOString().slice(0, 10).replaceAll("-", "");

const mapSlot = (
  slot: Prisma.DispatchSlotGetPayload<{ include: (typeof dispatchInclude)["slots"]["include"] }>,
) => ({
  ...slot,
  depot: {
    id: slot.depot.id,
    code: slot.depot.code,
    name: slot.depot.name,
    readiness: slot.depot.readiness,
    distributorId: slot.depot.distributorId,
    distributorName: slot.depot.distributor.name,
  },
});

const mapDay = (day: Prisma.DispatchDayGetPayload<{ include: typeof dispatchInclude }>) => ({
  ...day,
  slots: day.slots.map(mapSlot),
});

@Injectable()
export class DispatchService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(filters: { date?: string; clusterId?: string; status?: DispatchStatus }) {
    const rows = await this.prisma.dispatchDay.findMany({
      where: {
        clusterId: filters.clusterId,
        date: filters.date ? parseDay(filters.date) : undefined,
        status: filters.status,
      },
      include: dispatchInclude,
      orderBy: [{ date: "desc" }, { cluster: { name: "asc" } }],
    });
    return rows.map(mapDay);
  }

  async getById(id: string) {
    const day = await this.prisma.dispatchDay.findUnique({
      where: { id },
      include: dispatchInclude,
    });
    if (!day) {
      throw new NotFoundException("Dispatch day not found");
    }
    return mapDay(day);
  }

  /**
   * Depots in the cluster that can be placed on a route: active, recce-ready,
   * with at least one dispatchable QC assigned to the distributor or cluster.
   */
  async listCandidates(filters: { date: string; clusterId: string; excludeDispatchId?: string }) {
    const cluster = await this.prisma.cluster.findUnique({ where: { id: filters.clusterId } });
    if (!cluster) {
      throw new NotFoundException("Cluster not found");
    }

    const day = parseDay(filters.date);
    const now = new Date();

    const depots = await this.prisma.depot.findMany({
      where: {
        isActive: true,
        distributor: { isActive: true, clusterId: filters.clusterId },
      },
      include: {
        distributor: { select: { id: true, name: true, clusterId: true } },
      },
      orderBy: [{ code: "asc" }],
    });

    const plannedSlots = await this.prisma.dispatchSlot.findMany({
      where: {
        dispatchDay: {
          date: day,
          ...(filters.excludeDispatchId ? { id: { not: filters.excludeDispatchId } } : {}),
        },
      },
      select: { depotId: true },
    });
    const plannedDepotIds = new Set(plannedSlots.map((slot) => slot.depotId));

    const qcUsers = await this.prisma.user.findMany({
      where: { isActive: true, role: UserRole.qc },
      select: {
        id: true,
        fullName: true,
        staffId: true,
        assignments: {
          where: activeAtWhere(now),
        },
        assessments: {
          orderBy: { assessedAt: "desc" },
          take: 1,
          select: { result: true },
        },
      },
    });

    return depots.map((depot) => {
      const eligibleQcs = qcUsers
        .filter((user) => {
          const coversDepot = user.assignments.some(
            (assignment) =>
              assignment.distributorId === depot.distributorId ||
              assignment.clusterId === filters.clusterId ||
              assignment.regionId === cluster.regionId,
          );
          return coversDepot;
        })
        .map((user) => {
          const latest = user.assessments[0];
          const dispatchable = latest?.result === AssessmentResult.pass;
          return {
            id: user.id,
            fullName: user.fullName,
            staffId: user.staffId,
            dispatchable,
          };
        });

      const dispatchableQcs = eligibleQcs.filter((qc) => qc.dispatchable);
      const suggestedQc = dispatchableQcs[0] ?? null;

      let blockReason: string | null = null;
      if (depot.readiness !== DepotReadiness.ready) {
        blockReason =
          depot.readiness === DepotReadiness.hold
            ? "Recce is on hold — cannot dispatch"
            : "Recce not marked ready";
      } else if (dispatchableQcs.length === 0) {
        blockReason =
          eligibleQcs.length === 0
            ? "No QC assigned to this distributor or cluster"
            : "Assigned QC has not passed assessment";
      }

      return {
        depot: {
          id: depot.id,
          code: depot.code,
          name: depot.name,
          readiness: depot.readiness,
          distributorId: depot.distributorId,
          distributorName: depot.distributor.name,
        },
        suggestedQc,
        eligibleQcs: dispatchableQcs,
        alreadyPlanned: plannedDepotIds.has(depot.id),
        blockReason,
      };
    });
  }

  async create(userId: string, dto: CreateDispatchDto) {
    const cluster = await this.prisma.cluster.findUnique({ where: { id: dto.clusterId } });
    if (!cluster) {
      throw new BadRequestException("Cluster not found");
    }

    const date = parseDay(dto.date);
    const existing = await this.prisma.dispatchDay.findUnique({
      where: { clusterId_date: { clusterId: dto.clusterId, date } },
    });
    if (existing) {
      throw new ConflictException("A dispatch plan already exists for this cluster and date");
    }

    await this.assertSlotsValid(dto.clusterId, cluster.regionId, date, dto.slots);

    const day = await this.prisma.dispatchDay.create({
      data: {
        clusterId: dto.clusterId,
        date,
        notes: dto.notes?.trim() || null,
        createdByUserId: userId,
        slots: {
          create: dto.slots.map((slot, index) => ({
            depotId: slot.depotId,
            qcUserId: slot.qcUserId,
            sortOrder: slot.sortOrder ?? index,
          })),
        },
      },
      include: dispatchInclude,
    });

    return mapDay(day);
  }

  async update(id: string, dto: UpdateDispatchDto) {
    const existing = await this.getById(id);
    if (existing.status === DispatchStatus.frozen) {
      throw new BadRequestException("Frozen dispatch cannot be edited");
    }

    if (dto.slots) {
      await this.assertSlotsValid(
        existing.clusterId,
        existing.cluster.regionId,
        parseDay(String(existing.date).slice(0, 10)),
        dto.slots,
        id,
      );
    }

    const day = await this.prisma.$transaction(async (tx) => {
      if (dto.slots) {
        await tx.dispatchSlot.deleteMany({ where: { dispatchDayId: id } });
        await tx.dispatchSlot.createMany({
          data: dto.slots.map((slot, index) => ({
            dispatchDayId: id,
            depotId: slot.depotId,
            qcUserId: slot.qcUserId,
            sortOrder: slot.sortOrder ?? index,
          })),
        });
      }

      return tx.dispatchDay.update({
        where: { id },
        data: {
          notes: dto.notes === undefined ? undefined : dto.notes.trim() || null,
        },
        include: dispatchInclude,
      });
    });

    return mapDay(day);
  }

  /** Freeze the route: create scheduled visits and lock the plan. */
  async freeze(id: string, userId: string) {
    const existing = await this.prisma.dispatchDay.findUnique({
      where: { id },
      include: {
        slots: {
          include: {
            depot: true,
            qcUser: { select: { id: true, staffId: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException("Dispatch day not found");
    }
    if (existing.status === DispatchStatus.frozen) {
      throw new BadRequestException("Dispatch is already frozen");
    }
    if (existing.slots.length === 0) {
      throw new BadRequestException("Add at least one depot before freezing");
    }

    await this.prisma.$transaction(async (tx) => {
      for (const slot of existing.slots) {
        if (slot.depot.readiness !== DepotReadiness.ready) {
          throw new BadRequestException(
            `Depot ${slot.depot.code} is not recce-ready and cannot be frozen onto the route`,
          );
        }

        let visit = await tx.visit.findUnique({
          where: {
            depotId_qcUserId_date: {
              depotId: slot.depotId,
              qcUserId: slot.qcUserId,
              date: existing.date,
            },
          },
        });

        if (!visit) {
          const suffix =
            slot.qcUser.staffId?.replace(/[^A-Z0-9-]/gi, "") ?? slot.qcUserId.slice(0, 8);
          const code = `V-${slot.depot.code}-${formatVisitDate(existing.date)}-${suffix}`;
          visit = await tx.visit.create({
            data: {
              code,
              depotId: slot.depotId,
              qcUserId: slot.qcUserId,
              date: existing.date,
              status: VisitStatus.scheduled,
            },
          });
        } else if (
          visit.status === VisitStatus.scheduled ||
          visit.status === VisitStatus.in_progress
        ) {
          // Keep existing visit; link it to the slot.
        } else {
          throw new BadRequestException(
            `Visit for depot ${slot.depot.code} is already ${visit.status}`,
          );
        }

        await tx.dispatchSlot.update({
          where: { id: slot.id },
          data: { visitId: visit.id },
        });
      }

      await tx.dispatchDay.update({
        where: { id },
        data: {
          status: DispatchStatus.frozen,
          frozenAt: new Date(),
          frozenByUserId: userId,
        },
      });
    });

    return this.getById(id);
  }

  private async assertSlotsValid(
    clusterId: string,
    regionId: string,
    date: Date,
    slots: CreateDispatchSlotDto[],
    excludeDispatchId?: string,
  ) {
    const depotIds = slots.map((slot) => slot.depotId);
    if (new Set(depotIds).size !== depotIds.length) {
      throw new BadRequestException("Each depot may appear only once on a dispatch day");
    }

    const otherPlanned = await this.prisma.dispatchSlot.findMany({
      where: {
        depotId: { in: depotIds },
        dispatchDay: {
          date,
          ...(excludeDispatchId ? { id: { not: excludeDispatchId } } : {}),
        },
      },
      include: { depot: { select: { code: true } } },
    });
    if (otherPlanned.length > 0) {
      throw new ConflictException(
        `Depot ${otherPlanned[0]?.depot.code} is already planned for this date`,
      );
    }

    const now = new Date();
    for (const [index, slot] of slots.entries()) {
      const depot = await this.prisma.depot.findUnique({
        where: { id: slot.depotId },
        include: { distributor: true },
      });
      if (!depot?.isActive || !depot.distributor.isActive) {
        throw new BadRequestException(`Slot ${index + 1}: depot not found or inactive`);
      }
      if (depot.distributor.clusterId !== clusterId) {
        throw new BadRequestException(`Slot ${index + 1}: depot is not in this cluster`);
      }
      if (depot.readiness !== DepotReadiness.ready) {
        throw new BadRequestException(`Slot ${index + 1}: depot ${depot.code} is not recce-ready`);
      }

      const qc = await this.prisma.user.findUnique({
        where: { id: slot.qcUserId },
        include: {
          assignments: { where: activeAtWhere(now) },
          assessments: { orderBy: { assessedAt: "desc" }, take: 1 },
        },
      });
      if (!qc?.isActive || qc.role !== UserRole.qc) {
        throw new BadRequestException(`Slot ${index + 1}: QC not found or inactive`);
      }
      if (qc.assessments[0]?.result !== AssessmentResult.pass) {
        throw new BadRequestException(
          `Slot ${index + 1}: ${qc.fullName} has not passed assessment`,
        );
      }
      const covers = qc.assignments.some(
        (assignment) =>
          assignment.distributorId === depot.distributorId ||
          assignment.clusterId === clusterId ||
          assignment.regionId === regionId,
      );
      if (!covers) {
        throw new BadRequestException(
          `Slot ${index + 1}: ${qc.fullName} is not assigned to this depot's network`,
        );
      }
    }
  }
}
