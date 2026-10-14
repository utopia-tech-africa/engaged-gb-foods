import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DepotReadiness, EscalationTrigger, StockZone, VisitStatus } from "@prisma/client";

import { ASSESSABLE_ROLES } from "../../common/constants/readiness-roles";
import type { EnvironmentVariables } from "../../config/environment";
import { PrismaService } from "../prisma/prisma.service";
import type { OpsDashboardResponseDto } from "./dto/ops-dashboard-response.dto";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const parseDay = (value: string): Date => new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

const todayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const countFor = <Key extends string>(rows: { key: Key; count: number }[], key: Key): number =>
  rows.find((row) => row.key === key)?.count ?? 0;

@Injectable()
export class OpsDashboardService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async getDashboard(dateInput?: string): Promise<OpsDashboardResponseDto> {
    const day = dateInput ? parseDay(dateInput) : todayUtc();
    const dayEnd = new Date(day.getTime() + DAY_MS);
    const syncCutoff = new Date(
      Date.now() - this.config.get("CLIENT_SYNC_DELAY_HOURS", { infer: true }) * HOUR_MS,
    );

    const [
      depotReadinessGroups,
      visitStatusGroups,
      escalationGroups,
      qualityHolds,
      syncDelayedVisits,
      fieldUsers,
      latestAssessments,
      checkIns,
      checkOuts,
      stockZoneGroups,
      regions,
      regionDepotGroups,
      regionVisits,
      regionsSubmitted,
    ] = await Promise.all([
      this.prisma.depot.groupBy({
        by: ["readiness"],
        where: { isActive: true },
        _count: { _all: true },
      }),
      this.prisma.visit.groupBy({
        by: ["status"],
        where: { date: day },
        _count: { _all: true },
      }),
      this.prisma.escalation.groupBy({
        by: ["trigger"],
        where: { status: { in: ["open", "in_progress"] } },
        _count: { _all: true },
      }),
      this.prisma.stockLot.count({
        where: {
          zone: StockZone.held_or_rejected,
          dispositions: { none: {} },
          visit: { date: day },
        },
      }),
      this.prisma.visit.count({
        where: {
          date: day,
          status: VisitStatus.in_progress,
          OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: syncCutoff } }],
        },
      }),
      this.prisma.user.findMany({
        where: { isActive: true, role: { in: ASSESSABLE_ROLES } },
        select: { id: true },
      }),
      this.prisma.assessment.findMany({
        where: { user: { isActive: true, role: { in: ASSESSABLE_ROLES } } },
        orderBy: { assessedAt: "desc" },
        distinct: ["userId"],
        select: { result: true },
      }),
      this.prisma.attendance.count({
        where: { kind: "check_in", capturedAt: { gte: day, lt: dayEnd } },
      }),
      this.prisma.attendance.count({
        where: { kind: "check_out", capturedAt: { gte: day, lt: dayEnd } },
      }),
      this.prisma.stockLot.groupBy({
        by: ["zone"],
        where: { visit: { date: day } },
        _count: { _all: true },
        _sum: { baseQuantity: true },
      }),
      this.prisma.region.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.depot.findMany({
        where: { isActive: true, distributor: { isActive: true } },
        select: { distributor: { select: { regionId: true } } },
      }),
      this.prisma.visit.findMany({
        where: {
          date: day,
          status: { in: [VisitStatus.complete, VisitStatus.exception] },
        },
        select: {
          depotId: true,
          status: true,
          depot: { select: { distributor: { select: { regionId: true } } } },
        },
      }),
      this.prisma.dailyReturn.count({ where: { date: day, region: { isActive: true } } }),
    ]);

    const readinessRows = depotReadinessGroups.map((group) => ({
      key: group.readiness,
      count: group._count._all,
    }));
    const visitRows = visitStatusGroups.map((group) => ({
      key: group.status,
      count: group._count._all,
    }));
    const escalationRows = escalationGroups.map((group) => ({
      key: group.trigger,
      count: group._count._all,
    }));

    const depotsTotal = readinessRows.reduce((sum, row) => sum + row.count, 0);
    const openEscalations = escalationRows.reduce((sum, row) => sum + row.count, 0);

    const depotsByRegion = new Map<string, number>();
    for (const depot of regionDepotGroups) {
      const regionId = depot.distributor.regionId;
      depotsByRegion.set(regionId, (depotsByRegion.get(regionId) ?? 0) + 1);
    }

    const completeByRegion = new Map<string, Set<string>>();
    const exceptionByRegion = new Map<string, Set<string>>();
    for (const visit of regionVisits) {
      const regionId = visit.depot.distributor.regionId;
      const target = visit.status === VisitStatus.complete ? completeByRegion : exceptionByRegion;
      const depotIds = target.get(regionId) ?? new Set<string>();
      depotIds.add(visit.depotId);
      target.set(regionId, depotIds);
    }

    return {
      date: day.toISOString().slice(0, 10),
      kpis: {
        depotsTotal,
        depotsReady: countFor(readinessRows, DepotReadiness.ready),
        depotsHold: countFor(readinessRows, DepotReadiness.hold),
        visitsScheduled: countFor(visitRows, VisitStatus.scheduled),
        visitsInProgress: countFor(visitRows, VisitStatus.in_progress),
        visitsComplete: countFor(visitRows, VisitStatus.complete),
        visitsException: countFor(visitRows, VisitStatus.exception),
        openEscalations,
        qualityHolds,
        syncDelayedVisits,
        activeFieldUsers: fieldUsers.length,
        dispatchableStaff: latestAssessments.filter((row) => row.result === "pass").length,
      },
      visitStatusChart: Object.values(VisitStatus).map((status) => ({
        status,
        count: countFor(visitRows, status),
      })),
      depotReadinessChart: Object.values(DepotReadiness).map((readiness) => ({
        readiness,
        count: countFor(readinessRows, readiness),
      })),
      escalationByTrigger: Object.values(EscalationTrigger).map((trigger) => ({
        trigger,
        count: countFor(escalationRows, trigger),
      })),
      attendanceToday: { checkIns, checkOuts },
      stockByZone: Object.values(StockZone).map((zone) => {
        const group = stockZoneGroups.find((row) => row.zone === zone);
        return {
          zone,
          lots: group?._count._all ?? 0,
          baseQuantity: group?._sum.baseQuantity ?? 0,
        };
      }),
      regionCoverage: regions.map((region) => ({
        regionCode: region.code,
        regionName: region.name,
        depots: depotsByRegion.get(region.id) ?? 0,
        complete: completeByRegion.get(region.id)?.size ?? 0,
        exception: exceptionByRegion.get(region.id)?.size ?? 0,
      })),
      dailyReturnSubmission: { regionsSubmitted, regionsTotal: regions.length },
    };
  }
}
