"use client";

import type {
  AttendanceKind,
  CreateStockLotDto,
  StockEvidenceCategory,
} from "@/lib/api/generated/model";

import {
  addFieldOutboxEntry,
  type FieldOutboxFile,
  type FieldOutboxGeo,
  type StockLotOutboxPayload,
} from "./field-offline-idb";

const fileToOutboxFile = async (file: File): Promise<FieldOutboxFile> => ({
  name: file.name,
  type: file.type,
  arrayBuffer: await file.arrayBuffer(),
});

export type EnqueueAttendanceInput = {
  depotId: string;
  kind: AttendanceKind;
  photo: File;
  geo?: FieldOutboxGeo | null;
};

export const enqueueAttendance = async ({
  depotId,
  kind,
  photo,
  geo,
}: EnqueueAttendanceInput): Promise<void> => {
  const capturedAt = Date.now();
  await addFieldOutboxEntry({
    id: crypto.randomUUID(),
    kind: "attendance",
    createdAt: capturedAt,
    payload: {
      depotId,
      kind,
      capturedAt,
      ...(geo ? { geo } : {}),
      photo: await fileToOutboxFile(photo),
    },
  });
};

export type EnqueueStockLotInput = Omit<CreateStockLotDto, "evidence"> & {
  evidenceFiles: { category: StockEvidenceCategory; file: File }[];
};

export const enqueueStockLot = async ({
  evidenceFiles,
  ...fields
}: EnqueueStockLotInput): Promise<void> => {
  const capturedAt = Date.now();
  const payload: StockLotOutboxPayload = {
    ...fields,
    evidenceFiles: await Promise.all(
      evidenceFiles.map(async ({ category, file }) => ({
        category,
        capturedAt,
        ...(await fileToOutboxFile(file)),
      })),
    ),
  };
  await addFieldOutboxEntry({
    id: crypto.randomUUID(),
    kind: "stock_lot",
    createdAt: capturedAt,
    payload,
  });
};
