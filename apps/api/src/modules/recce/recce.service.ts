import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, RecceDecision } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type { CreateRecceDto } from "./dto/create-recce.dto";
import type { RecceChecklistDto } from "./dto/recce-checklist.dto";
import type { RecceGapInputDto } from "./dto/recce-gap-input.dto";
import type { UpdateRecceDto } from "./dto/update-recce.dto";

const recceInclude = {
  depot: { select: { id: true, code: true, name: true, readiness: true } },
  author: { select: { id: true, fullName: true, role: true } },
  gaps: { orderBy: { createdAt: "asc" } },
  evidence: { orderBy: { capturedAt: "asc" } },
} satisfies Prisma.RecceInclude;

const toChecklistJson = (checklist: RecceChecklistDto): Prisma.InputJsonObject => ({
  access: checklist.access,
  stockEstimate: checklist.stockEstimate,
  ...(checklist.stockEstimateNote?.trim()
    ? { stockEstimateNote: checklist.stockEstimateNote.trim() }
    : {}),
  workspace: checklist.workspace,
  power: checklist.power,
  signal: checklist.signal,
  holdingZones: checklist.holdingZones,
});

const toGapRows = (gaps: RecceGapInputDto[]) =>
  gaps.map((gap) => ({
    description: gap.description.trim(),
    ownerName: gap.ownerName.trim(),
    dueAt: gap.dueAt ? new Date(gap.dueAt) : null,
    isCritical: gap.isCritical,
  }));

/** A critical gap means the depot cannot be declared ready. */
const assertDecisionAllowed = (decision: RecceDecision, hasCriticalGap: boolean): void => {
  if (decision === "ready" && hasCriticalGap) {
    throw new BadRequestException(
      "A critical access or safety gap is open. The depot must be on hold, not ready.",
    );
  }
};

@Injectable()
export class RecceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listRecces(filters: { depotId?: string; decision?: RecceDecision }) {
    return this.prisma.recce.findMany({
      where: { depotId: filters.depotId, decision: filters.decision },
      include: recceInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async getRecceById(id: string) {
    const recce = await this.prisma.recce.findUnique({ where: { id }, include: recceInclude });
    if (!recce) {
      throw new NotFoundException("Recce not found");
    }
    return recce;
  }

  async createRecce(authorUserId: string, dto: CreateRecceDto) {
    const depot = await this.prisma.depot.findUnique({ where: { id: dto.depotId } });
    if (!depot) {
      throw new BadRequestException("Depot not found");
    }

    const gaps = dto.gaps ?? [];
    assertDecisionAllowed(
      dto.decision,
      gaps.some((gap) => gap.isCritical),
    );

    const capturedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const recce = await tx.recce.create({
        data: {
          depotId: dto.depotId,
          checklist: toChecklistJson(dto.checklist),
          decision: dto.decision,
          notes: dto.notes?.trim() || null,
          authorUserId,
          gaps: { create: toGapRows(gaps) },
          evidence: {
            create: (dto.evidenceKeys ?? []).map((objectKey) => ({
              objectKey: objectKey.trim(),
              capturedAt,
            })),
          },
        },
      });

      await this.syncDepotReadiness(tx, dto.depotId);
      return this.loadRecce(tx, recce.id);
    });
  }

  async updateRecce(id: string, dto: UpdateRecceDto) {
    const existing = await this.prisma.recce.findUnique({
      where: { id },
      include: { gaps: true, evidence: true },
    });
    if (!existing) {
      throw new NotFoundException("Recce not found");
    }

    const decision = dto.decision ?? existing.decision;
    const hasCriticalGap = (dto.gaps ?? existing.gaps).some((gap) => gap.isCritical);
    assertDecisionAllowed(decision, hasCriticalGap);

    const capturedAt = new Date();
    const keptEvidence = new Map(existing.evidence.map((item) => [item.objectKey, item]));

    return this.prisma.$transaction(async (tx) => {
      await tx.recce.update({
        where: { id },
        data: {
          checklist: dto.checklist ? toChecklistJson(dto.checklist) : undefined,
          decision: dto.decision,
          notes: dto.notes === undefined ? undefined : dto.notes.trim() || null,
        },
      });

      if (dto.gaps) {
        await tx.recceGap.deleteMany({ where: { recceId: id } });
        await tx.recceGap.createMany({
          data: toGapRows(dto.gaps).map((gap) => ({ ...gap, recceId: id })),
        });
      }

      if (dto.evidenceKeys) {
        await tx.recceEvidence.deleteMany({ where: { recceId: id } });
        await tx.recceEvidence.createMany({
          data: [...new Set(dto.evidenceKeys.map((key) => key.trim()))].map((objectKey) => ({
            recceId: id,
            objectKey,
            capturedAt: keptEvidence.get(objectKey)?.capturedAt ?? capturedAt,
          })),
        });
      }

      await this.syncDepotReadiness(tx, existing.depotId);
      return this.loadRecce(tx, id);
    });
  }

  /** Depot readiness follows the decision of the most recent recce for that depot. */
  private async syncDepotReadiness(tx: Prisma.TransactionClient, depotId: string): Promise<void> {
    const latest = await tx.recce.findFirst({
      where: { depotId },
      orderBy: { createdAt: "desc" },
      select: { decision: true },
    });
    if (!latest) {
      return;
    }
    await tx.depot.update({ where: { id: depotId }, data: { readiness: latest.decision } });
  }

  private loadRecce(tx: Prisma.TransactionClient, id: string) {
    return tx.recce.findUniqueOrThrow({ where: { id }, include: recceInclude });
  }
}
