import { API_BASE_URL } from "@/lib/api/custom-fetch";
import type { UploadPurpose } from "@/lib/api/generated/model";
import { postUploadsLocal, postUploadsPresign } from "@/lib/api/generated/uploads/uploads";
import { readAuthSession } from "@/lib/auth/storage";

/**
 * Uploads a photo and returns its object key. Tries a presigned PUT to R2 first and
 * falls back to the local dev upload endpoint. The file bytes never go through the
 * JSON client; only the presign and local endpoints do (via generated Orval functions).
 */
export const uploadPhoto = async (file: File, purpose: UploadPurpose): Promise<string> => {
  try {
    const presigned = await postUploadsPresign({
      contentType: file.type,
      contentLength: file.size,
      purpose,
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
    const local = await postUploadsLocal({ file });
    return local.objectKey;
  }
};

/**
 * Loads a private upload as a blob and returns an object URL for `<img src>`.
 * Binary responses are not JSON, so this is the one read path outside Orval hooks.
 */
export const fetchPhotoObjectUrl = async (objectKey: string): Promise<string> => {
  const accessToken = readAuthSession()?.accessToken;
  const response = await fetch(
    `${API_BASE_URL}/uploads/content?objectKey=${encodeURIComponent(objectKey)}`,
    { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
  );
  if (!response.ok) {
    throw new Error(`Could not load photo (${response.status})`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
