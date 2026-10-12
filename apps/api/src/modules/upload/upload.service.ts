import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { MAX_ATTENDANCE_PHOTO_BYTES, UploadPurpose } from "./dto/presign-upload.dto";
import { R2Config } from "./r2.config";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const extensionForContentType = (contentType: string): string => {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
};

@Injectable()
export class UploadService {
  private readonly uploadsDir = join(process.cwd(), ".uploads");

  constructor(@Inject(R2Config) private readonly r2Config: R2Config) {}

  assertAttendancePhotoContentType(contentType: string): void {
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new BadRequestException("contentType must be image/jpeg, image/png, or image/webp");
    }
  }

  assertPhotoObjectKey(objectKey: string): void {
    if (!objectKey.startsWith("attendance/") && !objectKey.startsWith("local/")) {
      throw new BadRequestException("photoObjectKey must start with attendance/ or local/");
    }
  }

  assertStockEvidenceObjectKey(objectKey: string): void {
    if (!objectKey.startsWith("stock_evidence/") && !objectKey.startsWith("local/")) {
      throw new BadRequestException("Evidence objectKey must start with stock_evidence/ or local/");
    }
  }

  assertSignatureObjectKey(objectKey: string): void {
    if (!objectKey.startsWith("signatures/") && !objectKey.startsWith("local/")) {
      throw new BadRequestException("Signature objectKey must start with signatures/ or local/");
    }
  }

  async createPresignedUpload(input: {
    contentType: string;
    contentLength: number;
    purpose: UploadPurpose;
  }): Promise<{ uploadUrl: string; objectKey: string; method: "PUT" }> {
    if (
      input.purpose !== UploadPurpose.attendance_photo &&
      input.purpose !== UploadPurpose.stock_evidence &&
      input.purpose !== UploadPurpose.signature
    ) {
      throw new BadRequestException("Unsupported upload purpose");
    }

    if (!this.r2Config.isConfigured()) {
      throw new ServiceUnavailableException(
        "Object storage is not configured. Use POST /uploads/local for local development.",
      );
    }

    this.assertAttendancePhotoContentType(input.contentType);

    if (input.contentLength > MAX_ATTENDANCE_PHOTO_BYTES) {
      throw new BadRequestException("File exceeds maximum size");
    }

    const ext = extensionForContentType(input.contentType);
    const prefix =
      input.purpose === UploadPurpose.stock_evidence
        ? "stock_evidence"
        : input.purpose === UploadPurpose.signature
          ? "signatures"
          : "attendance";
    const objectKey = `${prefix}/${randomUUID()}.${ext}`;

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${this.r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.r2Config.accessKeyId,
        secretAccessKey: this.r2Config.secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: this.r2Config.bucket,
      Key: objectKey,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });

    return { uploadUrl, objectKey, method: "PUT" };
  }

  async saveLocalUpload(input: {
    contentType: string;
    buffer: Buffer;
  }): Promise<{ objectKey: string }> {
    if (this.r2Config.isConfigured()) {
      throw new BadRequestException(
        "R2 is configured. Use POST /uploads/presign instead of local upload.",
      );
    }

    this.assertAttendancePhotoContentType(input.contentType);

    if (input.buffer.length > MAX_ATTENDANCE_PHOTO_BYTES) {
      throw new BadRequestException("File exceeds maximum size");
    }

    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }

    const ext = extensionForContentType(input.contentType);
    const fileName = `${randomUUID()}.${ext}`;
    const objectKey = `local/${fileName}`;
    const filePath = join(this.uploadsDir, fileName);

    writeFileSync(filePath, input.buffer);

    return { objectKey };
  }

  resolvePublicUrl(objectKey: string): string | null {
    if (objectKey.startsWith("local/")) {
      return null;
    }
    if (this.r2Config.isConfigured()) {
      return `${this.r2Config.publicBaseUrl}/${objectKey}`;
    }
    return null;
  }

  getLocalFilePath(objectKey: string): string {
    if (!objectKey.startsWith("local/")) {
      throw new BadRequestException("Not a local object key");
    }
    const fileName = objectKey.slice("local/".length);
    if (fileName.includes("..") || fileName.includes("/")) {
      throw new BadRequestException("Invalid object key");
    }
    return join(this.uploadsDir, fileName);
  }
}
