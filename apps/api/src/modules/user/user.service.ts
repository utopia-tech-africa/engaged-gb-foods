import { Inject, Injectable } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listUsers(filters: { role?: UserRole }) {
    return this.prisma.user.findMany({
      where: { isActive: true, role: filters.role },
      select: { id: true, fullName: true, staffId: true, role: true, isActive: true },
      orderBy: { fullName: "asc" },
    });
  }
}
