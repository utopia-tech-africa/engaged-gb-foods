import "reflect-metadata";

import { PrismaClient } from "@prisma/client";

import { GHANA_REGIONS } from "../modules/network/ghana-regions";

const prisma = new PrismaClient();

const seed = async (): Promise<void> => {
  for (const region of GHANA_REGIONS) {
    await prisma.region.upsert({
      where: { code: region.code },
      create: {
        code: region.code,
        name: region.name,
        slug: region.slug,
        isActive: true,
      },
      update: {
        name: region.name,
        slug: region.slug,
        isActive: true,
      },
    });
  }

  const greaterAccra = await prisma.region.findUniqueOrThrow({ where: { code: "GA" } });

  const cluster = await prisma.cluster.upsert({
    where: {
      regionId_code: {
        regionId: greaterAccra.id,
        code: "GA-C01",
      },
    },
    create: {
      regionId: greaterAccra.id,
      name: "Greater Accra Central",
      code: "GA-C01",
    },
    update: {
      name: "Greater Accra Central",
    },
  });

  const distributorSeeds = [
    {
      code: "GA-D01",
      name: "Accra Fresh Distributors Ltd",
      contactName: "Kwame Boateng",
      contactPhone: "0244111001",
    },
    {
      code: "GA-D02",
      name: "Tema Logistics & Supply",
      contactName: "Efua Adjei",
      contactPhone: "0244111002",
    },
  ] as const;

  const distributors = [];
  for (const entry of distributorSeeds) {
    const distributor = await prisma.distributor.upsert({
      where: { code: entry.code },
      create: {
        regionId: greaterAccra.id,
        clusterId: cluster.id,
        name: entry.name,
        code: entry.code,
        contactName: entry.contactName,
        contactPhone: entry.contactPhone,
        isActive: true,
      },
      update: {
        regionId: greaterAccra.id,
        clusterId: cluster.id,
        name: entry.name,
        contactName: entry.contactName,
        contactPhone: entry.contactPhone,
        isActive: true,
      },
    });
    distributors.push(distributor);
  }

  const depotSeeds = [
    {
      distributorCode: "GA-D01",
      code: "GA-D01-01",
      name: "Accra North Main Depot",
      address: "Plot 14, North Industrial Area, Accra",
      latitude: 5.6148,
      longitude: -0.2057,
    },
    {
      distributorCode: "GA-D02",
      code: "GA-D02-01",
      name: "Tema Port Side Depot",
      address: "Harbour Road, Tema Community 1",
      latitude: 5.6698,
      longitude: -0.0167,
    },
  ] as const;

  for (const entry of depotSeeds) {
    const distributor = distributors.find((item) => item.code === entry.distributorCode);
    if (!distributor) {
      continue;
    }

    await prisma.depot.upsert({
      where: {
        distributorId_code: {
          distributorId: distributor.id,
          code: entry.code,
        },
      },
      create: {
        distributorId: distributor.id,
        code: entry.code,
        name: entry.name,
        address: entry.address,
        latitude: entry.latitude,
        longitude: entry.longitude,
        readiness: "ready",
        isActive: true,
      },
      update: {
        name: entry.name,
        address: entry.address,
        latitude: entry.latitude,
        longitude: entry.longitude,
        readiness: "ready",
        isActive: true,
      },
    });
  }

  const qcUser = await prisma.user.findUnique({ where: { staffId: "BTL-0031" } });
  const firstDistributor = distributors[0];

  if (qcUser && firstDistributor) {
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        userId: qcUser.id,
        distributorId: firstDistributor.id,
        effectiveTo: null,
      },
    });

    if (!existingAssignment) {
      await prisma.assignment.create({
        data: {
          userId: qcUser.id,
          distributorId: firstDistributor.id,
          effectiveFrom: new Date(),
        },
      });
    }
  }

  const skuSeeds = [
    {
      name: "Gino Tomato Mix",
      brand: "Gino",
      packFactor: 24,
      caseUnit: "case",
      looseUnit: "sachet",
    },
    {
      name: "Pomo Tomato Mix",
      brand: "Pomo",
      packFactor: 24,
      caseUnit: "case",
      looseUnit: "sachet",
    },
  ] as const;

  for (const entry of skuSeeds) {
    await prisma.sku.upsert({
      where: { name: entry.name },
      create: {
        name: entry.name,
        brand: entry.brand,
        packFactor: entry.packFactor,
        caseUnit: entry.caseUnit,
        looseUnit: entry.looseUnit,
        isActive: true,
      },
      update: {
        brand: entry.brand,
        packFactor: entry.packFactor,
        caseUnit: entry.caseUnit,
        looseUnit: entry.looseUnit,
        isActive: true,
      },
    });
  }

  console.log(
    `Seeded ${GHANA_REGIONS.length} regions, 1 cluster, ${distributors.length} distributors, ${depotSeeds.length} depots, ${skuSeeds.length} SKUs`,
  );
};

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
