import type { PrismaClient } from "@prisma/client";

type VisitSyncClient = Pick<PrismaClient, "visit">;

export const stampVisitLastSyncedAt = async (
  client: VisitSyncClient,
  visitId: string,
): Promise<void> => {
  await client.visit.update({
    where: { id: visitId },
    data: { lastSyncedAt: new Date() },
  });
};
