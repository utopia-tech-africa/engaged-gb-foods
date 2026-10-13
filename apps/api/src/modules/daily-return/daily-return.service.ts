import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type { CreateDailyReturnDto } from "./dto/create-daily-return.dto";
import type { UpdateDailyReturnDto } from "./dto/update-daily-return.dto";

const dailyReturnInclude = {
  region: { select: { id: true, code: true, name: true } },
  submittedBy: { select: { id: true, fullName: true, role: true } },
} satisfies Prisma.DailyReturnInclude;

const parseDay = (value: string): Date => new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

const todayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const trimOrNull = (value: string | undefined): string | null => value?.trim() || null;

const assertCounts = (planned: number, completed: number, exception: number): void => {
  if (completed + exception > planned) {
    throw new BadRequestException(
      "Completed plus exception depots cannot exceed the planned depots.",
    );
  }
};

@Injectable()
export class DailyReturnService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(filters: { regionId?: string; date?: string }) {
    return this.prisma.dailyReturn.findMany({
      where: {
        regionId: filters.regionId,
        date: filters.date ? parseDay(filters.date) : undefined,
      },
      include: dailyReturnInclude,
      orderBy: [{ date: "desc" }, { region: { name: "asc" } }],
    });
  }

  async getById(id: string) {
    const dailyReturn = await this.prisma.dailyReturn.findUnique({
      where: { id },
      include: dailyReturnInclude,
    });
    if (!dailyReturn) {
      throw new NotFoundException("Daily return not found");
    }
    return dailyReturn;
  }

  /** Active depots planned, plus complete and exception visits, for one region and day. */
  private async deriveCounts(regionId: string, date: Date) {
    const [depotsPlanned, depotsCompleted, depotsException] = await Promise.all([
      this.prisma.depot.count({
        where: { isActive: true, distributor: { regionId, isActive: true } },
      }),
      this.countVisits(regionId, date, "complete"),
      this.countVisits(regionId, date, "exception"),
    ]);
    return { depotsPlanned, depotsCompleted, depotsException };
  }

  private async countVisits(regionId: string, date: Date, status: "complete" | "exception") {
    const visits = await this.prisma.visit.findMany({
      where: { date, status, depot: { distributor: { regionId } } },
      select: { depotId: true },
      distinct: ["depotId"],
    });
    return visits.length;
  }

  async submit(userId: string, dto: CreateDailyReturnDto) {
    const region = await this.prisma.region.findUnique({ where: { id: dto.regionId } });
    if (!region) {
      throw new BadRequestException("Region not found");
    }

    const date = parseDay(dto.date);
    const derived = await this.deriveCounts(dto.regionId, date);
    const depotsPlanned = dto.depotsPlanned ?? derived.depotsPlanned;
    const depotsCompleted = dto.depotsCompleted ?? derived.depotsCompleted;
    const depotsException = dto.depotsException ?? derived.depotsException;
    assertCounts(depotsPlanned, depotsCompleted, depotsException);

    const fields = {
      coverageSummary: dto.coverageSummary.trim(),
      stockStatusSummary: dto.stockStatusSummary.trim(),
      variancesSummary: trimOrNull(dto.variancesSummary),
      incidentsSummary: trimOrNull(dto.incidentsSummary),
      depotsPlanned,
      depotsCompleted,
      depotsException,
    };

    return this.prisma.dailyReturn.upsert({
      where: { regionId_date: { regionId: dto.regionId, date } },
      create: {
        regionId: dto.regionId,
        date,
        submittedByUserId: userId,
        ...fields,
      },
      update: { ...fields, submittedByUserId: userId, submittedAt: new Date() },
      include: dailyReturnInclude,
    });
  }

  async update(id: string, userId: string, dto: UpdateDailyReturnDto) {
    const existing = await this.getById(id);

    const depotsPlanned = dto.depotsPlanned ?? existing.depotsPlanned;
    const depotsCompleted = dto.depotsCompleted ?? existing.depotsCompleted;
    const depotsException = dto.depotsException ?? existing.depotsException;
    assertCounts(depotsPlanned, depotsCompleted, depotsException);

    return this.prisma.dailyReturn.update({
      where: { id },
      data: {
        coverageSummary: dto.coverageSummary?.trim(),
        stockStatusSummary: dto.stockStatusSummary?.trim(),
        variancesSummary:
          dto.variancesSummary === undefined ? undefined : trimOrNull(dto.variancesSummary),
        incidentsSummary:
          dto.incidentsSummary === undefined ? undefined : trimOrNull(dto.incidentsSummary),
        depotsPlanned,
        depotsCompleted,
        depotsException,
        submittedByUserId: userId,
        submittedAt: new Date(),
      },
      include: dailyReturnInclude,
    });
  }

  async nationalSummary(dateInput?: string) {
    const date = dateInput ? parseDay(dateInput) : todayUtc();

    const [regions, returns] = await Promise.all([
      this.prisma.region.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.dailyReturn.findMany({
        where: { date },
        include: dailyReturnInclude,
      }),
    ]);

    const returnByRegion = new Map(returns.map((entry) => [entry.regionId, entry]));

    const regionRows = regions.map((region) => {
      const entry = returnByRegion.get(region.id);
      return {
        region,
        submitted: Boolean(entry),
        return: entry ?? null,
      };
    });

    const totals = returns.reduce(
      (sum, entry) => ({
        depotsPlanned: sum.depotsPlanned + entry.depotsPlanned,
        depotsCompleted: sum.depotsCompleted + entry.depotsCompleted,
        depotsException: sum.depotsException + entry.depotsException,
      }),
      { depotsPlanned: 0, depotsCompleted: 0, depotsException: 0 },
    );

    return {
      date: date.toISOString().slice(0, 10),
      regionsSubmitted: regionRows.filter((row) => row.submitted).length,
      regionsTotal: regions.length,
      totals,
      returns: regionRows,
    };
  }
}
