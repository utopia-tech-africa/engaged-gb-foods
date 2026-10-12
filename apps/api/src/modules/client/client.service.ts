import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Prisma, StockZone, type UserRole, VisitStatus } from "@prisma/client";

import type { EnvironmentVariables } from "../../config/environment";
import { PrismaService } from "../prisma/prisma.service";
import { VisitService } from "../visit/visit.service";

const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const defaultDateIso = (): string => new Date().toISOString().slice(0, 10);

const PENDING_REVIEW_ZONES = new Set<StockZone>([
  StockZone.conforming_pending_release,
  StockZone.recoverable_pending_approval,
  StockZone.held_or_rejected,
]);

export type ClientReviewStatus = "pending" | "hold" | "reviewed";

type LotWithDispositions = {
  zone: StockZone;
  dispositions: { id: string }[];
  baseQuantity: number;
};

const lotNeedsReview = (lot: LotWithDispositions): boolean =>
  PENDING_REVIEW_ZONES.has(lot.zone) && lot.dispositions.length === 0;

const computeReviewStatus = (lots: LotWithDispositions[]): ClientReviewStatus => {
  const heldOpen = lots.some(
    (lot) => lot.zone === StockZone.held_or_rejected && lot.dispositions.length === 0,
  );
  if (heldOpen) {
    return "hold";
  }
  if (lots.some(lotNeedsReview)) {
    return "pending";
  }
  return "reviewed";
};

const computeCoverage = (lots: LotWithDispositions[]): number => {
  if (lots.length === 0) {
    return 0;
  }
  const total = lots.reduce((sum, lot) => sum + lot.baseQuantity, 0);
  if (total === 0) {
    return 0;
  }
  const examined = lots
    .filter((lot) => lot.zone !== StockZone.unexamined)
    .reduce((sum, lot) => sum + lot.baseQuantity, 0);
  return Math.round((examined / total) * 100);
};

const maxDate = (values: (Date | null | undefined)[]): Date | null => {
  let best: Date | null = null;
  for (const value of values) {
    if (!value) {
      continue;
    }
    if (!best || value.getTime() > best.getTime()) {
      best = value;
    }
  }
  return best;
};

const csvEscape = (value: string | number | null | undefined): string => {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

const csvRow = (cells: (string | number | null | undefined)[]): string =>
  `${cells.map(csvEscape).join(",")}\n`;

const depotInclude = {
  distributor: {
    select: {
      region: { select: { id: true, name: true, code: true } },
    },
  },
} satisfies Prisma.DepotInclude;

const visitDayInclude = {
  stockLots: {
    include: {
      dispositions: { select: { id: true } },
      sku: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.VisitInclude;

type ScopeDepot = Prisma.DepotGetPayload<{ include: typeof depotInclude }>;
type ScopeVisit = Prisma.VisitGetPayload<{ include: typeof visitDayInclude }>;

@Injectable()
export class ClientService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(VisitService) private readonly visitService: VisitService,
    @Inject(ConfigService) private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  private syncDelayMs(): number {
    const hours = this.config.get("CLIENT_SYNC_DELAY_HOURS", { infer: true });
    return hours * 60 * 60 * 1000;
  }

  private resolveVisitDay(date?: string): Date {
    const iso = date ?? defaultDateIso();
    return startOfUtcDay(new Date(`${iso}T00:00:00.000Z`));
  }

  private async loadScope(input: { date?: string; regionId?: string; depotId?: string }) {
    const visitDay = this.resolveVisitDay(input.date);
    const dateIso = visitDay.toISOString().slice(0, 10);

    const depotWhere: Prisma.DepotWhereInput = { isActive: true };
    if (input.depotId) {
      depotWhere.id = input.depotId;
    }
    if (input.regionId) {
      depotWhere.distributor = { regionId: input.regionId, isActive: true };
    }

    const depots = await this.prisma.depot.findMany({
      where: depotWhere,
      orderBy: [{ code: "asc" }],
      include: depotInclude,
    });

    const visitWhere: Prisma.VisitWhereInput = { date: visitDay };
    if (input.depotId) {
      visitWhere.depotId = input.depotId;
    }
    if (input.regionId) {
      visitWhere.depot = { distributor: { regionId: input.regionId } };
    }

    const visits = await this.prisma.visit.findMany({
      where: visitWhere,
      include: {
        ...visitDayInclude,
        depot: { include: depotInclude },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    const visitsByDepot = new Map<string, typeof visits>();
    for (const visit of visits) {
      const list = visitsByDepot.get(visit.depotId) ?? [];
      list.push(visit);
      visitsByDepot.set(visit.depotId, list);
    }

    return { visitDay, dateIso, depots, visits, visitsByDepot };
  }

  private visitHasSyncDelay(
    visit: { status: VisitStatus; lastSyncedAt: Date | null },
    now: Date,
  ): boolean {
    if (visit.status !== VisitStatus.in_progress) {
      return false;
    }
    if (visit.lastSyncedAt === null) {
      return true;
    }
    return now.getTime() - visit.lastSyncedAt.getTime() > this.syncDelayMs();
  }

  private aggregateDepotRow(input: { depot: ScopeDepot; visits: ScopeVisit[]; now: Date }) {
    const primaryVisit = input.visits[0] ?? null;
    const lots = input.visits.flatMap((visit) => visit.stockLots);
    const lastSyncedAt = maxDate(input.visits.map((visit) => visit.lastSyncedAt));
    const reviewStatus = computeReviewStatus(lots);
    const coverage = computeCoverage(lots);
    const openHolds = lots.filter((lot) => lot.zone === StockZone.held_or_rejected).length;
    const syncDelayed = input.visits.some((visit) => this.visitHasSyncDelay(visit, input.now));

    return {
      depotId: input.depot.id,
      code: input.depot.code,
      name: input.depot.name,
      regionName: input.depot.distributor.region.name,
      visitStatus: primaryVisit?.status ?? null,
      coverage,
      reviewStatus,
      lastSyncedAt,
      openHolds,
      syncDelayed,
      isComplete: primaryVisit?.status === VisitStatus.complete,
      lots,
    };
  }

  async getOverview(filters: {
    date?: string;
    regionId?: string;
    depotId?: string;
    reviewStatus?: ClientReviewStatus;
  }) {
    const now = new Date();
    const { dateIso, depots, visitsByDepot } = await this.loadScope(filters);

    const allRows = depots.map((depot) =>
      this.aggregateDepotRow({
        depot,
        visits: visitsByDepot.get(depot.id) ?? [],
        now,
      }),
    );

    let rows = allRows;
    if (filters.reviewStatus) {
      rows = allRows.filter((row) => row.reviewStatus === filters.reviewStatus);
    }

    const allLots = allRows.flatMap((row) => row.lots);
    const recordsToReview = allLots.filter(lotNeedsReview).length;
    const qualityHolds = allLots.filter((lot) => lot.zone === StockZone.held_or_rejected).length;
    const depotsComplete = allRows.filter((row) => row.isComplete).length;
    const depotsWithSyncDelay = allRows.filter((row) => row.syncDelayed).length;
    const lastSyncAt = maxDate(allRows.map((row) => row.lastSyncedAt));

    const depotsPayload = rows.map(
      ({ lots: _lots, syncDelayed: _syncDelayed, isComplete: _isComplete, ...row }) => row,
    );

    return {
      date: dateIso,
      lastSyncAt,
      depotsComplete,
      depotsTotal: allRows.length,
      recordsToReview,
      qualityHolds,
      depotsWithSyncDelay,
      depots: depotsPayload,
    };
  }

  async getDepotPack(depotId: string, userId: string, userRole: UserRole, date?: string) {
    const visitDay = this.resolveVisitDay(date);
    const dateIso = visitDay.toISOString().slice(0, 10);

    const depot = await this.prisma.depot.findFirst({
      where: { id: depotId, isActive: true },
      include: depotInclude,
    });
    if (!depot) {
      throw new NotFoundException("Depot not found");
    }

    const visits = await this.prisma.visit.findMany({
      where: { depotId, date: visitDay },
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true, code: true, status: true, lastSyncedAt: true },
    });

    const reconciliations = await Promise.all(
      visits.map((visit) => this.visitService.getReconciliation(visit.id, userId, userRole)),
    );

    const lots = await this.prisma.stockLot.findMany({
      where: { visit: { depotId, date: visitDay } },
      orderBy: [{ createdAt: "asc" }],
      include: {
        sku: true,
        dispositions: {
          orderBy: { decidedAt: "desc" },
          include: {
            decidedBy: { select: { id: true, fullName: true, role: true } },
          },
        },
        visit: { select: { id: true, code: true } },
      },
    });

    const holds = lots
      .filter((lot) => lot.zone === StockZone.held_or_rejected)
      .map((lot) => ({
        id: lot.id,
        visitCode: lot.visit.code,
        skuName: lot.sku.name,
        batchCode: lot.batchCode,
        baseQuantity: lot.baseQuantity,
        custodian: lot.custodian,
        pendingDisposition: lot.dispositions.length === 0,
        dispositions: lot.dispositions,
      }));

    return {
      date: dateIso,
      depot: {
        id: depot.id,
        code: depot.code,
        name: depot.name,
        regionName: depot.distributor.region.name,
      },
      visits,
      reconciliations,
      lots,
      holds,
    };
  }

  async exportReconciliationCsv(
    userId: string,
    userRole: UserRole,
    filters: { date?: string; regionId?: string },
  ): Promise<string> {
    const { dateIso, depots, visitsByDepot } = await this.loadScope(filters);
    const now = new Date();

    let body =
      "date,region,depot_code,depot_name,visit_status,sku,batch,opening,closing_total,variance\n";

    for (const depot of depots) {
      const visits = visitsByDepot.get(depot.id) ?? [];
      if (visits.length === 0) {
        continue;
      }
      const row = this.aggregateDepotRow({ depot, visits, now });
      for (const visit of visits) {
        const reconciliation = await this.visitService.getReconciliation(
          visit.id,
          userId,
          userRole,
        );
        for (const line of reconciliation.lines) {
          body += csvRow([
            dateIso,
            depot.distributor.region.name,
            depot.code,
            depot.name,
            row.visitStatus ?? "",
            line.skuName,
            line.batchCode,
            line.opening,
            line.closingTotal,
            line.variance,
          ]);
        }
      }
    }

    return body;
  }

  async exportHoldsCsv(filters: { date?: string; regionId?: string }): Promise<string> {
    const visitDay = this.resolveVisitDay(filters.date);
    const dateIso = visitDay.toISOString().slice(0, 10);

    const visitWhere: Prisma.VisitWhereInput = { date: visitDay };
    if (filters.regionId) {
      visitWhere.depot = { distributor: { regionId: filters.regionId } };
    }

    const lots = await this.prisma.stockLot.findMany({
      where: {
        zone: StockZone.held_or_rejected,
        visit: visitWhere,
      },
      orderBy: [{ createdAt: "asc" }],
      include: {
        sku: { select: { name: true } },
        visit: {
          select: {
            code: true,
            depot: {
              select: {
                code: true,
                name: true,
                distributor: { select: { region: { select: { name: true } } } },
              },
            },
          },
        },
        dispositions: {
          orderBy: { decidedAt: "desc" },
          take: 1,
          select: { decision: true, reason: true, decidedAt: true },
        },
      },
    });

    let body =
      "date,region,depot_code,depot_name,visit_code,sku,batch,base_quantity,custodian,pending_disposition,last_decision,last_reason,last_decided_at\n";

    for (const lot of lots) {
      const last = lot.dispositions[0];
      body += csvRow([
        dateIso,
        lot.visit.depot.distributor.region.name,
        lot.visit.depot.code,
        lot.visit.depot.name,
        lot.visit.code,
        lot.sku.name,
        lot.batchCode,
        lot.baseQuantity,
        lot.custodian,
        lot.dispositions.length === 0 ? "yes" : "no",
        last?.decision ?? "",
        last?.reason ?? "",
        last?.decidedAt?.toISOString() ?? "",
      ]);
    }

    return body;
  }
}
