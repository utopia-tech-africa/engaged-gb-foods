import type { Assignment, Prisma } from "@prisma/client";

export const activeAssignmentWhere = (userId: string, at: Date): Prisma.AssignmentWhereInput => ({
  userId,
  effectiveFrom: { lte: at },
  OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
});

export const depotScopeFromAssignments = (
  assignments: Assignment[],
): Prisma.DepotWhereInput | null => {
  const orConditions: Prisma.DepotWhereInput[] = [];

  for (const assignment of assignments) {
    if (assignment.distributorId) {
      orConditions.push({ distributorId: assignment.distributorId });
    }
    if (assignment.clusterId) {
      orConditions.push({ distributor: { clusterId: assignment.clusterId } });
    }
    if (assignment.regionId) {
      orConditions.push({ distributor: { regionId: assignment.regionId } });
    }
  }

  if (orConditions.length === 0) {
    return null;
  }

  return { isActive: true, OR: orConditions };
};
