import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  type Prisma,
  SignatureRole,
  StockMovementType,
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
import type { CloseVisitDto } from "./dto/close-visit.dto";
import type { CreateVisitSignatureDto } from "./dto/create-visit-signature.dto";

const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const REQUIRED_SIGNATURE_ROLES: SignatureRole[] = [
  SignatureRole.qc,
  SignatureRole.cluster_supervisor,
  SignatureRole.depot_representative,
];

const OPS_ROLES = new Set<UserRole>([
  UserRole.cluster_supervisor,
  UserRole.regional_supervisor,
  UserRole.national_ops,
  UserRole.national_quality,
  UserRole.admin,
  UserRole.gbfoods_reviewer,
]);

const SUPERVISOR_SIGN_ROLES = new Set<UserRole>([
  UserRole.cluster_supervisor,
  UserRole.regional_supervisor,
  UserRole.national_ops,
  UserRole.national_quality,
  UserRole.admin,
]);

const FIELD_VISIT_ROLES = new Set<UserRole>([
  UserRole.qc,
  UserRole.handler,
  UserRole.cluster_supervisor,
  UserRole.regional_supervisor,
]);

const visitListInclude = {
  depot: { select: { id: true, code: true, name: true } },
  qcUser: { select: { id: true, fullName: true, staffId: true } },
  signatures: { orderBy: { signedAt: "asc" as const } },
} satisfies Prisma.VisitInclude;

export type VisitListRecord = Prisma.VisitGetPayload<{ include: typeof visitListInclude }>;

type ZoneTotals = Record<StockZone, number>;

const emptyZoneTotals = (): ZoneTotals => ({
  [StockZone.unexamined]: 0,
  [StockZone.conforming_pending_release]: 0,
  [StockZone.recoverable_pending_approval]: 0,
  [StockZone.held_or_rejected]: 0,
  [StockZone.released_remaining_on_site]: 0,
});

@Injectable()
export class VisitService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(UploadService) private readonly uploadService: UploadService,
  ) {}

  private async userCanAccessDepot(
    userId: string,
    userRole: UserRole,
    depotId: string,
  ): Promise<boolean> {
    if (OPS_ROLES.has(userRole)) {
      return true;
    }

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

  private async getVisitOrThrow(visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        depot: { select: { id: true, code: true, name: true } },
        qcUser: { select: { id: true, fullName: true, staffId: true } },
        signatures: true,
        stockLots: {
          include: {
            sku: true,
            movements: true,
          },
        },
      },
    });
    if (!visit) {
      throw new NotFoundException("Visit not found");
    }
    return visit;
  }

  async listVisits(
    userId: string,
    userRole: UserRole,
    filters: { depotId?: string; date?: string; status?: VisitStatus },
  ): Promise<VisitListRecord[]> {
    const where: Prisma.VisitWhereInput = {};

    if (filters.depotId) {
      where.depotId = filters.depotId;
    }
    if (filters.date) {
      where.date = startOfUtcDay(new Date(`${filters.date}T00:00:00.000Z`));
    }
    if (filters.status) {
      where.status = filters.status;
    }

    if (!OPS_ROLES.has(userRole)) {
      const now = new Date();
      const assignments = await this.prisma.assignment.findMany({
        where: activeAssignmentWhere(userId, now),
      });
      const scope = depotScopeFromAssignments(assignments);
      if (!scope) {
        return [];
      }
      where.depot = scope;
    }

    return this.prisma.visit.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: visitListInclude,
    });
  }

  async getReconciliation(visitId: string, userId: string, userRole: UserRole) {
    const visit = await this.getVisitOrThrow(visitId);
    const allowed = await this.userCanAccessDepot(userId, userRole, visit.depotId);
    if (!allowed) {
      throw new ForbiddenException("You are not assigned to this depot scope");
    }

    type GroupKey = string;
    const groups = new Map<
      GroupKey,
      {
        skuId: string;
        batchCode: string;
        skuName: string;
        opening: number;
        inward: number;
        outward: number;
        closingByZone: ZoneTotals;
        lotIds: string[];
      }
    >();

    for (const lot of visit.stockLots) {
      const key = `${lot.skuId}::${lot.batchCode}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          skuId: lot.skuId,
          batchCode: lot.batchCode,
          skuName: lot.sku.name,
          opening: 0,
          inward: 0,
          outward: 0,
          closingByZone: emptyZoneTotals(),
          lotIds: [],
        };
        groups.set(key, group);
      }

      group.lotIds.push(lot.id);
      group.closingByZone[lot.zone] += lot.baseQuantity;

      for (const movement of lot.movements) {
        if (movement.type === StockMovementType.opening) {
          group.opening += movement.baseQuantity;
        }
      }
    }

    const lines = [...groups.values()].map((group) => {
      const closingTotal = Object.values(group.closingByZone).reduce(
        (sum, value) => sum + value,
        0,
      );
      const variance = group.opening + group.inward - group.outward - closingTotal;
      return {
        skuId: group.skuId,
        batchCode: group.batchCode,
        skuName: group.skuName,
        opening: group.opening,
        inward: group.inward,
        outward: group.outward,
        closingByZone: group.closingByZone,
        closingTotal,
        variance,
        lotIds: group.lotIds,
      };
    });

    const heldLotsWithoutCustodian = visit.stockLots
      .filter(
        (lot) =>
          lot.zone === StockZone.held_or_rejected &&
          (lot.custodian === null || lot.custodian.trim().length === 0),
      )
      .map((lot) => ({
        id: lot.id,
        skuId: lot.skuId,
        batchCode: lot.batchCode,
        skuName: lot.sku.name,
        baseQuantity: lot.baseQuantity,
      }));

    const signedRoles = new Set(visit.signatures.map((item) => item.role));
    const missingSignatures = REQUIRED_SIGNATURE_ROLES.filter((role) => !signedRoles.has(role));

    const hasVariance = lines.some((line) => line.variance !== 0);
    const canClose =
      missingSignatures.length === 0 &&
      heldLotsWithoutCustodian.length === 0 &&
      !hasVariance &&
      visit.status !== VisitStatus.complete &&
      visit.status !== VisitStatus.exception;

    return {
      visit: {
        id: visit.id,
        code: visit.code,
        date: visit.date,
        status: visit.status,
        reconciledAt: visit.reconciledAt,
        depot: visit.depot,
        qcUser: visit.qcUser,
      },
      lines,
      heldLotsWithoutCustodian,
      signatures: visit.signatures,
      missingSignatures,
      canClose,
    };
  }

  private assertSignatureRoleAllowed(
    visit: { qcUserId: string },
    userId: string,
    userRole: UserRole,
    dto: CreateVisitSignatureDto,
  ): { signedByUserId: string | null } {
    switch (dto.role) {
      case SignatureRole.qc:
        if (userId !== visit.qcUserId && userRole !== UserRole.qc) {
          throw new ForbiddenException("QC signature must be from the visit QC or a QC user");
        }
        return { signedByUserId: userId };

      case SignatureRole.cluster_supervisor:
        if (!SUPERVISOR_SIGN_ROLES.has(userRole)) {
          throw new ForbiddenException("Cluster supervisor signature requires a supervisor role");
        }
        return { signedByUserId: userId };

      case SignatureRole.depot_representative:
        if (!FIELD_VISIT_ROLES.has(userRole)) {
          throw new ForbiddenException("Depot representative signature requires a field role");
        }
        return { signedByUserId: null };

      default:
        throw new BadRequestException("Unsupported signature role");
    }
  }

  async addSignature(
    visitId: string,
    userId: string,
    userRole: UserRole,
    dto: CreateVisitSignatureDto,
  ) {
    const visit = await this.getVisitOrThrow(visitId);
    const allowed = await this.userCanAccessDepot(userId, userRole, visit.depotId);
    if (!allowed) {
      throw new ForbiddenException("You are not assigned to this depot scope");
    }

    if (visit.status === VisitStatus.complete || visit.status === VisitStatus.exception) {
      throw new BadRequestException("Visit is already closed");
    }

    if (dto.imageObjectKey) {
      this.uploadService.assertSignatureObjectKey(dto.imageObjectKey);
    }

    const { signedByUserId } = this.assertSignatureRoleAllowed(visit, userId, userRole, dto);

    return this.prisma.visitSignature.upsert({
      where: {
        visitId_role: {
          visitId,
          role: dto.role,
        },
      },
      create: {
        visitId,
        role: dto.role,
        signerName: dto.signerName.trim(),
        imageObjectKey: dto.imageObjectKey ?? null,
        signedByUserId,
      },
      update: {
        signerName: dto.signerName.trim(),
        imageObjectKey: dto.imageObjectKey ?? null,
        signedAt: new Date(),
        signedByUserId,
      },
    });
  }

  async closeVisit(visitId: string, userId: string, userRole: UserRole, dto: CloseVisitDto) {
    const reconciliation = await this.getReconciliation(visitId, userId, userRole);
    const visit = await this.getVisitOrThrow(visitId);

    if (visit.status === VisitStatus.complete || visit.status === VisitStatus.exception) {
      throw new BadRequestException("Visit is already closed");
    }

    const openActions = dto.openActions ?? [];

    if (openActions.length > 0) {
      if (openActions.some((item) => !item.description.trim() || !item.ownerName.trim())) {
        throw new BadRequestException("Each open action needs description and owner");
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.visitOpenAction.createMany({
          data: openActions.map((item) => ({
            visitId,
            description: item.description.trim(),
            ownerName: item.ownerName.trim(),
            dueAt: item.dueAt ? startOfUtcDay(new Date(`${item.dueAt}T00:00:00.000Z`)) : null,
            acceptedByGBfoods: item.acceptedByGBfoods ?? false,
          })),
        });

        return tx.visit.update({
          where: { id: visitId },
          data: {
            status: VisitStatus.exception,
            reconciledAt: new Date(),
          },
          include: visitListInclude,
        });
      });
    }

    if (!reconciliation.canClose) {
      throw new BadRequestException(
        "Visit cannot close: missing signatures, custodians, or unexplained variance",
      );
    }

    return this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.complete,
        reconciledAt: new Date(),
      },
      include: visitListInclude,
    });
  }
}
