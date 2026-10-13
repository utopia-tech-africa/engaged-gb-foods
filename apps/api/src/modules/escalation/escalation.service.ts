import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { EscalationStatus, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { UploadService } from "../upload/upload.service";
import type { CreateEscalationDto } from "./dto/create-escalation.dto";
import type { UpdateEscalationDto } from "./dto/update-escalation.dto";

const escalationInclude = {
  depot: { select: { id: true, code: true, name: true } },
  reportedBy: { select: { id: true, fullName: true, role: true } },
  evidence: { orderBy: { capturedAt: "asc" } },
} satisfies Prisma.EscalationInclude;

const trimOrNull = (value: string | undefined): string | null => value?.trim() || null;

@Injectable()
export class EscalationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(UploadService) private readonly uploadService: UploadService,
  ) {}

  async list(filters: { depotId?: string; visitId?: string; status?: EscalationStatus }) {
    return this.prisma.escalation.findMany({
      where: { depotId: filters.depotId, visitId: filters.visitId, status: filters.status },
      include: escalationInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const escalation = await this.prisma.escalation.findUnique({
      where: { id },
      include: escalationInclude,
    });
    if (!escalation) {
      throw new NotFoundException("Escalation not found");
    }
    return escalation;
  }

  /** Records the exception only; the visit status is left alone so the field can still reconcile. */
  async create(userId: string, dto: CreateEscalationDto) {
    const depot = await this.prisma.depot.findUnique({ where: { id: dto.depotId } });
    if (!depot) {
      throw new BadRequestException("Depot not found");
    }

    if (dto.visitId) {
      const visit = await this.prisma.visit.findUnique({ where: { id: dto.visitId } });
      if (!visit) {
        throw new BadRequestException("Visit not found");
      }
      if (visit.depotId !== dto.depotId) {
        throw new BadRequestException("Visit does not belong to this depot");
      }
    }

    const evidenceKeys = [...new Set((dto.evidenceKeys ?? []).map((key) => key.trim()))];
    for (const objectKey of evidenceKeys) {
      this.uploadService.assertEscalationPhotoObjectKey(objectKey);
    }

    const capturedAt = new Date();
    return this.prisma.escalation.create({
      data: {
        depotId: dto.depotId,
        visitId: dto.visitId,
        trigger: dto.trigger,
        note: dto.note.trim(),
        ownerName: trimOrNull(dto.ownerName),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        reportedByUserId: userId,
        evidence: { create: evidenceKeys.map((objectKey) => ({ objectKey, capturedAt })) },
      },
      include: escalationInclude,
    });
  }

  async update(id: string, dto: UpdateEscalationDto) {
    const existing = await this.getById(id);

    const resolvedAt = (() => {
      if (dto.status === undefined || dto.status === existing.status) {
        return undefined;
      }
      return dto.status === "resolved" ? new Date() : null;
    })();

    return this.prisma.escalation.update({
      where: { id },
      data: {
        status: dto.status,
        ownerName: dto.ownerName === undefined ? undefined : trimOrNull(dto.ownerName),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        writtenRecord: dto.writtenRecord === undefined ? undefined : trimOrNull(dto.writtenRecord),
        resolvedAt,
      },
      include: escalationInclude,
    });
  }
}
