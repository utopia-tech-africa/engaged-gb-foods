import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import type { ClusterResponseDto } from "./dto/cluster-response.dto";

@Injectable()
export class ClusterService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listClusters(regionId?: string): Promise<ClusterResponseDto[]> {
    return this.prisma.cluster.findMany({
      where: { regionId },
      orderBy: [{ name: "asc" }],
      select: { id: true, regionId: true, code: true, name: true, supervisorUserId: true },
    });
  }
}
