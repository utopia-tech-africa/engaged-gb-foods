import "reflect-metadata";

import { PrismaClient, type UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedUser = {
  fullName: string;
  role: UserRole;
  staffId?: string;
  email?: string;
  pin?: string;
  password?: string;
  phone?: string;
};

const seeds: SeedUser[] = [
  {
    fullName: "Abena Mensah",
    role: "qc",
    staffId: "BTL-0031",
    pin: "2468",
    phone: "0244000001",
  },
  {
    fullName: "Kojo Asante",
    role: "cluster_supervisor",
    staffId: "BTL-0105",
    pin: "1357",
    phone: "0244000002",
  },
  {
    fullName: "Platform Admin",
    role: "admin",
    email: "admin@gbfoods.local",
    password: "ChangeMe123!",
  },
  {
    fullName: "GBfoods Reviewer",
    role: "gbfoods_reviewer",
    email: "reviewer@gbfoods.local",
    password: "ChangeMe123!",
  },
  {
    fullName: "National Operations",
    role: "national_ops",
    email: "ops@gbfoods.local",
    password: "ChangeMe123!",
  },
];

const seed = async (): Promise<void> => {
  for (const entry of seeds) {
    const pinHash = entry.pin ? await bcrypt.hash(entry.pin, 10) : null;
    const passwordHash = entry.password ? await bcrypt.hash(entry.password, 10) : null;
    const staffId = entry.staffId?.toUpperCase() ?? null;
    const email = entry.email?.toLowerCase() ?? null;

    const existing = staffId
      ? await prisma.user.findUnique({ where: { staffId } })
      : email
        ? await prisma.user.findUnique({ where: { email } })
        : null;

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: entry.fullName,
          role: entry.role,
          phone: entry.phone ?? null,
          pinHash,
          passwordHash,
          isActive: true,
          failedPinAttempts: 0,
          lockedAt: null,
        },
      });
      continue;
    }

    await prisma.user.create({
      data: {
        fullName: entry.fullName,
        role: entry.role,
        staffId,
        email,
        phone: entry.phone ?? null,
        pinHash,
        passwordHash,
      },
    });
  }

  console.log(`Seeded ${seeds.length} auth users`);
};

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
