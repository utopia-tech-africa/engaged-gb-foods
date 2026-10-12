import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DispositionDecision,
  type Prisma,
  StockEvidenceCategory,
  StockMovementType,
  StockUnit,
  StockZone,
  UserRole,
  VisitStatus,
} from "@prisma/client";

import {
  activeAssignmentWhere,
  depotScopeFromAssignments,
} from "../assignment/assignment-depots.helper";
import { PrismaService } from "../prisma/prisma.service";
import { UploadService } from "../upload/upload.service";
import type { CreateDispositionDto } from "./dto/create-disposition.dto";
import type { CreateStockLotDto } from "./dto/create-stock-lot.dto";
import type { PatchStockLotCustodianDto } from "./dto/patch-stock-lot-custodian.dto";

const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const formatVisitDate = (value: Date): string => {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
};

const ZONES_REQUIRING_DEFECT_EVIDENCE: StockZone[] = [
  StockZone.held_or_rejected,
  StockZone.recoverable_pending_approval,
];

const REQUIRED_EVIDENCE_CATEGORIES: StockEvidenceCategory[] = [
  StockEvidenceCategory.pack,
  StockEvidenceCategory.batch,
  StockEvidenceCategory.defect,
];

const stockLotInclude = {
  sku: true,
  evidence: { orderBy: { capturedAt: "asc" as const } },
  visit: {
    select: {
      id: true,
      code: true,
      date: true,
      status: true,
      depot: { select: { id: true, code: true, name: true } },
    },
  },
  createdBy: { select: { id: true, fullName: true, staffId: true, role: true } },
  dispositions: {
    orderBy: { decidedAt: "desc" as const },
    include: {
      decidedBy: { select: { id: true, fullName: true, role: true } },
    },
  },
} satisfies Prisma.StockLotInclude;

const zoneForDisposition = (decision: DispositionDecision): StockZone => {
  switch (decision) {
    case DispositionDecision.release:
      return StockZone.released_remaining_on_site;
    case DispositionDecision.hold:
    case DispositionDecision.reject:
      return StockZone.held_or_rejected;
    case DispositionDecision.approve_repack:
      return StockZone.recoverable_pending_approval;
    default:
      return StockZone.held_or_rejected;
  }
};

const LOCKED_ZONE_TARGETS = new Set<StockZone>([
  StockZone.released_remaining_on_site,
  StockZone.conforming_pending_release,
]);

export type StockLotRecord = Prisma.StockLotGetPayload<{ include: typeof stockLotInclude }>;

@Injectable()
export class StockLotService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(UploadService) private readonly uploadService: UploadService,
  ) {}

  private computeBaseQuantity(quantity: number, unit: StockUnit, packFactor: number): number {
    if (unit === StockUnit.cases) {
      return quantity * packFactor;
    }
    return quantity;
  }

  private assertEvidenceForZone(zone: StockZone, evidence: CreateStockLotDto["evidence"]): void {
    if (!ZONES_REQUIRING_DEFECT_EVIDENCE.includes(zone)) {
      return;
    }

    const categories = new Set(evidence.map((item) => item.category));
    for (const required of REQUIRED_EVIDENCE_CATEGORIES) {
      if (!categories.has(required)) {
        throw new BadRequestException(
          `Zone ${zone} requires evidence categories: pack, batch, and defect`,
        );
      }
    }
  }

  private async userCanAccessDepot(userId: string, depotId: string): Promise<boolean> {
    const now = new Date();
    const assignments = await this.prisma.assignment.findMany({
      where: activeAssignmentWhere(userId, now),
    });
    const scope = depotScopeFromAssignments(assignments);
    if (!scope) {
      return false;
    }

    const depot = await this.prisma.depot.findFirst({
      where: { id: depotId, ...scope },
    });
    return depot !== null;
  }

  private async resolveVisitForCapture(input: {
    userId: string;
    visitId?: string;
    depotId?: string;
  }): Promise<{ visitId: string; depotId: string }> {
    if (input.visitId) {
      const visit = await this.prisma.visit.findUnique({
        where: { id: input.visitId },
        include: { depot: true },
      });
      if (!visit) {
        throw new NotFoundException("Visit not found");
      }
      const allowed = await this.userCanAccessDepot(input.userId, visit.depotId);
      if (!allowed) {
        throw new ForbiddenException("You are not assigned to this depot scope");
      }
      return { visitId: visit.id, depotId: visit.depotId };
    }

    if (!input.depotId) {
      throw new BadRequestException("Either visitId or depotId is required");
    }

    const depot = await this.prisma.depot.findUnique({ where: { id: input.depotId } });
    if (!depot) {
      throw new NotFoundException("Depot not found");
    }

    const allowed = await this.userCanAccessDepot(input.userId, input.depotId);
    if (!allowed) {
      throw new ForbiddenException("You are not assigned to this depot scope");
    }

    const visitDay = startOfUtcDay(new Date());
    const existing = await this.prisma.visit.findUnique({
      where: {
        depotId_qcUserId_date: {
          depotId: input.depotId,
          qcUserId: input.userId,
          date: visitDay,
        },
      },
    });

    if (existing) {
      if (existing.status === VisitStatus.scheduled) {
        await this.prisma.visit.update({
          where: { id: existing.id },
          data: { status: VisitStatus.in_progress },
        });
      }
      return { visitId: existing.id, depotId: input.depotId };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { staffId: true },
    });
    const suffix = user?.staffId?.replace(/[^A-Z0-9-]/gi, "") ?? input.userId.slice(0, 8);
    const code = `V-${depot.code}-${formatVisitDate(visitDay)}-${suffix}`;

    const visit = await this.prisma.visit.create({
      data: {
        code,
        depotId: input.depotId,
        qcUserId: input.userId,
        date: visitDay,
        status: VisitStatus.in_progress,
      },
    });

    return { visitId: visit.id, depotId: input.depotId };
  }

  async createStockLot(userId: string, dto: CreateStockLotDto): Promise<StockLotRecord> {
    if (!dto.visitId && !dto.depotId) {
      throw new BadRequestException("Either visitId or depotId is required");
    }

    const sku = await this.prisma.sku.findFirst({
      where: { id: dto.skuId, isActive: true },
    });
    if (!sku) {
      throw new NotFoundException("SKU not found");
    }

    this.assertEvidenceForZone(dto.zone, dto.evidence);

    for (const item of dto.evidence) {
      this.uploadService.assertStockEvidenceObjectKey(item.objectKey);
    }

    const { visitId } = await this.resolveVisitForCapture({
      userId,
      visitId: dto.visitId,
      depotId: dto.depotId,
    });

    const baseQuantity = this.computeBaseQuantity(dto.quantity, dto.unit, sku.packFactor);
    const capturedAt = new Date();

    return this.prisma.stockLot.create({
      data: {
        visitId,
        skuId: dto.skuId,
        batchCode: dto.batchCode.trim(),
        expiryDate: dto.expiryDate
          ? startOfUtcDay(new Date(`${dto.expiryDate}T00:00:00.000Z`))
          : null,
        zone: dto.zone,
        quantity: dto.quantity,
        unit: dto.unit,
        baseQuantity,
        notes: dto.notes?.trim() ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        accuracyMeters: dto.accuracyMeters ?? null,
        createdByUserId: userId,
        evidence: {
          create: dto.evidence.map((item) => ({
            category: item.category,
            objectKey: item.objectKey,
            capturedAt,
          })),
        },
        movements: {
          create: {
            type: StockMovementType.opening,
            quantity: dto.quantity,
            baseQuantity,
          },
        },
      },
      include: stockLotInclude,
    });
  }

  async listStockLots(
    userId: string,
    userRole: string,
    filters: { visitId?: string; depotId?: string; date?: string },
  ): Promise<StockLotRecord[]> {
    if (!filters.visitId && !filters.depotId && !filters.date) {
      throw new BadRequestException("Provide visitId, depotId, or date");
    }

    const visitWhere: Prisma.VisitWhereInput = {};

    if (filters.visitId) {
      visitWhere.id = filters.visitId;
    }
    if (filters.depotId) {
      visitWhere.depotId = filters.depotId;
    }
    if (filters.date) {
      visitWhere.date = startOfUtcDay(new Date(`${filters.date}T00:00:00.000Z`));
    }

    const opsRoles = new Set([
      "cluster_supervisor",
      "regional_supervisor",
      "national_ops",
      "national_quality",
      "admin",
      "gbfoods_reviewer",
    ]);

    if (!opsRoles.has(userRole)) {
      const now = new Date();
      const assignments = await this.prisma.assignment.findMany({
        where: activeAssignmentWhere(userId, now),
      });
      const scope = depotScopeFromAssignments(assignments);
      if (!scope) {
        return [];
      }
      visitWhere.depot = scope;
    }

    return this.prisma.stockLot.findMany({
      where: { visit: visitWhere },
      orderBy: [{ createdAt: "desc" }],
      include: stockLotInclude,
    });
  }

  async getStockLotById(id: string): Promise<StockLotRecord> {
    const lot = await this.prisma.stockLot.findUnique({
      where: { id },
      include: stockLotInclude,
    });
    if (!lot) {
      throw new NotFoundException("Stock lot not found");
    }
    return lot;
  }

  assertZonePatchAllowed(nextZone: StockZone): void {
    if (LOCKED_ZONE_TARGETS.has(nextZone)) {
      throw new BadRequestException(
        "Zone cannot be set to release or conforming via direct update; use GBfoods disposition",
      );
    }
  }

  async patchCustodian(
    userId: string,
    userRole: UserRole,
    lotId: string,
    dto: PatchStockLotCustodianDto,
  ): Promise<StockLotRecord> {
    const lot = await this.getStockLotById(lotId);

    if (lot.zone !== StockZone.held_or_rejected) {
      throw new BadRequestException("Custodian applies only to held or rejected lots");
    }

    const opsRoles = new Set<UserRole>([
      UserRole.cluster_supervisor,
      UserRole.regional_supervisor,
      UserRole.admin,
    ]);

    if (!opsRoles.has(userRole)) {
      const allowed = await this.userCanAccessDepot(userId, lot.visit.depot.id);
      if (!allowed) {
        throw new ForbiddenException("You are not assigned to this depot scope");
      }
    }

    return this.prisma.stockLot.update({
      where: { id: lotId },
      data: { custodian: dto.custodian.trim() },
      include: stockLotInclude,
    });
  }

  async createDisposition(
    userId: string,
    lotId: string,
    dto: CreateDispositionDto,
  ): Promise<StockLotRecord> {
    const reason = dto.reason.trim();
    if (!reason) {
      throw new BadRequestException("reason is required");
    }

    const lot = await this.getStockLotById(lotId);
    const nextZone = zoneForDisposition(dto.decision);

    return this.prisma.$transaction(async (tx) => {
      await tx.disposition.create({
        data: {
          stockLotId: lotId,
          decision: dto.decision,
          reason,
          decidedByUserId: userId,
        },
      });

      await tx.stockMovement.create({
        data: {
          stockLotId: lotId,
          type: StockMovementType.disposition,
          quantity: lot.quantity,
          baseQuantity: lot.baseQuantity,
        },
      });

      return tx.stockLot.update({
        where: { id: lotId },
        data: { zone: nextZone },
        include: stockLotInclude,
      });
    });
  }
}
