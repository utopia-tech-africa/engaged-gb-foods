const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type AttendanceKind = "check_in" | "check_out";

export type AttendanceRecord = {
  id: string;
  visitId: string | null;
  userId: string;
  depotId: string;
  kind: AttendanceKind;
  photoObjectKey: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  capturedAt: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    staffId: string | null;
    role: string;
  };
  depot: {
    id: string;
    code: string;
    name: string;
  };
  visit: {
    id: string;
    code: string;
    status: string;
  } | null;
};

export type MyDepot = {
  id: string;
  distributorId: string;
  code: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
};

type JsonRequestInit = Omit<RequestInit, "body"> & { body?: unknown };

const requestJson = async <T>(
  accessToken: string,
  path: string,
  init: JsonRequestInit = {},
): Promise<T> => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
    ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...init.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { message?: string | string[] };
      if (typeof payload.message === "string") {
        message = payload.message;
      } else if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      }
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const fetchMyDepots = (accessToken: string): Promise<MyDepot[]> =>
  requestJson(accessToken, "/assignments/me/depots");

export const presignAttendancePhoto = (
  accessToken: string,
  body: { contentType: string; contentLength: number },
): Promise<{ uploadUrl: string; objectKey: string; method: "PUT" }> =>
  requestJson(accessToken, "/uploads/presign", {
    method: "POST",
    body: { ...body, purpose: "attendance_photo" },
  });

export const uploadAttendancePhotoLocal = async (
  accessToken: string,
  file: File,
): Promise<{ objectKey: string }> => {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE_URL}/uploads/local`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Local upload failed (${response.status})`);
  }

  return (await response.json()) as { objectKey: string };
};

export const uploadPhotoForAttendance = async (
  accessToken: string,
  file: File,
): Promise<string> => {
  try {
    const presigned = await presignAttendancePhoto(accessToken, {
      contentType: file.type,
      contentLength: file.size,
    });
    const putResponse = await fetch(presigned.uploadUrl, {
      method: presigned.method,
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putResponse.ok) {
      throw new Error("R2 upload failed");
    }
    return presigned.objectKey;
  } catch {
    const local = await uploadAttendancePhotoLocal(accessToken, file);
    return local.objectKey;
  }
};

export const postAttendance = (
  accessToken: string,
  body: {
    depotId: string;
    kind: AttendanceKind;
    photoObjectKey: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  },
): Promise<AttendanceRecord> => requestJson(accessToken, "/attendance", { method: "POST", body });

export const fetchAttendanceForDate = (
  accessToken: string,
  params: { date: string; depotId?: string; userId?: string },
): Promise<AttendanceRecord[]> => {
  const search = new URLSearchParams({ date: params.date });
  if (params.depotId) {
    search.set("depotId", params.depotId);
  }
  if (params.userId) {
    search.set("userId", params.userId);
  }
  return requestJson(accessToken, `/attendance?${search.toString()}`);
};

export const fetchPhotoObjectUrl = async (
  accessToken: string,
  objectKey: string,
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/uploads/content?objectKey=${encodeURIComponent(objectKey)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    throw new Error(`Could not load photo (${response.status})`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
