import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AttendanceKind, type Prisma, VisitStatus } from "@prisma/client";

import {
  activeAssignmentWhere,
  depotScopeFromAssignments,
} from "../assignment/assignment-depots.helper";
import { PrismaService } from "../prisma/prisma.service";
import { UploadService } from "../upload/upload.service";
import type { CreateAttendanceDto } from "./dto/create-attendance.dto";

const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const formatVisitDate = (value: Date): string => {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
};

export type AttendanceRecord = Prisma.AttendanceGetPayload<{
  include: {
    user: { select: { id: true; fullName: true; staffId: true; role: true } };
    depot: { select: { id: true; code: true; name: true } };
    visit: { select: { id: true; code: true; status: true } };
  };
}>;

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(UploadService) private readonly uploadService: UploadService,
  ) {}

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

  private async ensureVisitForCheckIn(input: {
    depotId: string;
    userId: string;
    visitDay: Date;
    depotCode: string;
    staffId: string | null;
  }) {
    const existing = await this.prisma.visit.findUnique({
      where: {
        depotId_qcUserId_date: {
          depotId: input.depotId,
          qcUserId: input.userId,
          date: input.visitDay,
        },
      },
    });

    if (existing) {
      if (existing.status === "scheduled") {
        return this.prisma.visit.update({
          where: { id: existing.id },
          data: { status: VisitStatus.in_progress },
        });
      }
      return existing;
    }

    const suffix = input.staffId?.replace(/[^A-Z0-9-]/gi, "") ?? input.userId.slice(0, 8);
    const code = `V-${input.depotCode}-${formatVisitDate(input.visitDay)}-${suffix}`;

    return this.prisma.visit.create({
      data: {
        code,
        depotId: input.depotId,
        qcUserId: input.userId,
        date: input.visitDay,
        status: VisitStatus.in_progress,
      },
    });
  }

  async createAttendance(userId: string, dto: CreateAttendanceDto): Promise<AttendanceRecord> {
    const depot = await this.prisma.depot.findUnique({ where: { id: dto.depotId } });
    if (!depot) {
      throw new NotFoundException("Depot not found");
    }

    const allowed = await this.userCanAccessDepot(userId, dto.depotId);
    if (!allowed) {
      throw new ForbiddenException("You are not assigned to this depot scope");
    }

    this.uploadService.assertPhotoObjectKey(dto.photoObjectKey);

    const capturedAt = new Date();
    const visitDay = startOfUtcDay(capturedAt);

    let visitId: string | null = null;

    if (dto.kind === AttendanceKind.check_in) {
      const visit = await this.ensureVisitForCheckIn({
        depotId: dto.depotId,
        userId,
        visitDay,
        depotCode: depot.code,
        staffId:
          (
            await this.prisma.user.findUnique({
              where: { id: userId },
              select: { staffId: true },
            })
          )?.staffId ?? null,
      });
      visitId = visit.id;
    } else {
      const visit = await this.prisma.visit.findUnique({
        where: {
          depotId_qcUserId_date: {
            depotId: dto.depotId,
            qcUserId: userId,
            date: visitDay,
          },
        },
      });
      if (visit) {
        visitId = visit.id;
        await this.prisma.visit.update({
          where: { id: visit.id },
          data: { status: VisitStatus.complete },
        });
      }
    }

    return this.prisma.attendance.create({
      data: {
        visitId,
        userId,
        depotId: dto.depotId,
        kind: dto.kind,
        photoObjectKey: dto.photoObjectKey,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        accuracyMeters: dto.accuracyMeters ?? null,
        capturedAt,
      },
      include: {
        user: { select: { id: true, fullName: true, staffId: true, role: true } },
        depot: { select: { id: true, code: true, name: true } },
        visit: { select: { id: true, code: true, status: true } },
      },
    });
  }

  async listAttendance(filters: {
    depotId?: string;
    userId?: string;
    date: string;
  }): Promise<AttendanceRecord[]> {
    const dayStart = startOfUtcDay(new Date(`${filters.date}T00:00:00.000Z`));
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const where: Prisma.AttendanceWhereInput = {
      capturedAt: { gte: dayStart, lt: dayEnd },
    };

    if (filters.depotId) {
      where.depotId = filters.depotId;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: [{ capturedAt: "desc" }],
      include: {
        user: { select: { id: true, fullName: true, staffId: true, role: true } },
        depot: { select: { id: true, code: true, name: true } },
        visit: { select: { id: true, code: true, status: true } },
      },
    });
  }

  async listMyAttendanceToday(userId: string): Promise<AttendanceRecord[]> {
    const today = startOfUtcDay(new Date());
    const iso = today.toISOString().slice(0, 10);
    return this.listAttendance({ userId, date: iso });
  }
}
