import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AssessmentResult, Prisma } from "@prisma/client";

import { ASSESSABLE_ROLES } from "../../common/constants/readiness-roles";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateAssessmentDto } from "./dto/create-assessment.dto";

const assessmentInclude = {
  user: { select: { id: true, fullName: true, staffId: true, role: true } },
  assessedBy: { select: { id: true, fullName: true, role: true } },
} satisfies Prisma.AssessmentInclude;

/** Any failed mandatory step means fail; only a full pass is dispatchable. */
export const deriveAssessmentResult = (input: {
  safetyPass: boolean;
  qualityPass: boolean;
  recordsPass: boolean;
}): AssessmentResult =>
  input.safetyPass && input.qualityPass && input.recordsPass ? "pass" : "fail";

const withDispatchable = <T extends { result: AssessmentResult }>(assessment: T) => ({
  ...assessment,
  dispatchable: assessment.result === "pass",
});

@Injectable()
export class AssessmentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listAssessments(filters: { userId?: string; result?: AssessmentResult; history: boolean }) {
    if (filters.history) {
      const rows = await this.prisma.assessment.findMany({
        where: { userId: filters.userId, result: filters.result },
        include: assessmentInclude,
        orderBy: { assessedAt: "desc" },
      });
      return rows.map(withDispatchable);
    }

    // Latest assessment per user first, then apply the result filter to that latest row.
    const rows = await this.prisma.assessment.findMany({
      where: { userId: filters.userId },
      include: assessmentInclude,
      orderBy: { assessedAt: "desc" },
    });
    const latestByUser = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!latestByUser.has(row.userId)) {
        latestByUser.set(row.userId, row);
      }
    }

    return [...latestByUser.values()]
      .filter((row) => !filters.result || row.result === filters.result)
      .map(withDispatchable);
  }

  async getAssessmentById(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: assessmentInclude,
    });
    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }
    return withDispatchable(assessment);
  }

  async createAssessment(assessedByUserId: string, dto: CreateAssessmentDto) {
    const subject = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!subject?.isActive) {
      throw new BadRequestException("User not found or inactive");
    }
    if (!ASSESSABLE_ROLES.includes(subject.role)) {
      throw new BadRequestException("Only qc, handler, and cluster supervisor roles are assessed");
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        userId: dto.userId,
        safetyPass: dto.safetyPass,
        qualityPass: dto.qualityPass,
        recordsPass: dto.recordsPass,
        result: deriveAssessmentResult(dto),
        notes: dto.notes?.trim() || null,
        assessedByUserId,
      },
      include: assessmentInclude,
    });
    return withDispatchable(assessment);
  }
}
