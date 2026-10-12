import { existsSync } from "node:fs";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";

import { FIELD_ATTENDANCE_WRITE_ROLES } from "../../common/constants/attendance-roles";
import { NETWORK_READ_ROLES } from "../../common/constants/network-roles";
import { FIELD_STOCK_WRITE_ROLES } from "../../common/constants/stock-roles";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { MAX_ATTENDANCE_PHOTO_BYTES, PresignUploadDto } from "./dto/presign-upload.dto";
import { UploadService } from "./upload.service";

@ApiTags("Uploads")
@Controller("uploads")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(@Inject(UploadService) private readonly uploadService: UploadService) {}

  @Post("presign")
  @Roles(...FIELD_ATTENDANCE_WRITE_ROLES, ...FIELD_STOCK_WRITE_ROLES)
  @ApiOperation({
    operationId: "postUploadsPresign",
    summary: "Presign photo upload",
    description:
      "Returns a presigned PUT URL for attendance or stock evidence when R2 is configured.",
  })
  @ApiCreatedResponse({ description: "Presigned upload details" })
  postUploadsPresign(@Body() body: PresignUploadDto) {
    return this.uploadService.createPresignedUpload(body);
  }

  @Post("local")
  @Roles(...FIELD_ATTENDANCE_WRITE_ROLES, ...FIELD_STOCK_WRITE_ROLES)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_ATTENDANCE_PHOTO_BYTES } }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiOperation({
    operationId: "postUploadsLocal",
    summary: "Local dev photo upload",
    description:
      "Writes the file to apps/api/.uploads when R2 is not configured. Returns objectKey local/…",
  })
  @ApiCreatedResponse({ description: "Local object key" })
  async postUploadsLocal(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number } | undefined,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException("file is required");
    }
    return this.uploadService.saveLocalUpload({
      contentType: file.mimetype,
      buffer: file.buffer,
    });
  }

  @Post("local/raw")
  @Roles(...FIELD_ATTENDANCE_WRITE_ROLES, ...FIELD_STOCK_WRITE_ROLES)
  @ApiConsumes("application/octet-stream", "image/jpeg", "image/png", "image/webp")
  @ApiOperation({
    operationId: "postUploadsLocalRaw",
    summary: "Local dev raw body upload",
    description: "Alternative local upload using raw body and Content-Type header.",
  })
  @ApiCreatedResponse({ description: "Local object key" })
  async postUploadsLocalRaw(@Req() req: Request) {
    const contentType = req.headers["content-type"] ?? "application/octet-stream";
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    return this.uploadService.saveLocalUpload({
      contentType,
      buffer,
    });
  }

  @Get("content")
  @Roles(...NETWORK_READ_ROLES)
  @ApiOperation({
    operationId: "getUploadsContent",
    summary: "Stream or redirect uploaded content",
    description: "Redirects to R2 public URL or streams a local dev file by objectKey.",
  })
  @ApiOkResponse({ description: "File content" })
  async getUploadsContent(@Query("objectKey") objectKey: string, @Res() res: Response) {
    if (!objectKey) {
      res.status(400).json({ message: "objectKey is required" });
      return;
    }

    const publicUrl = this.uploadService.resolvePublicUrl(objectKey);
    if (publicUrl) {
      res.redirect(publicUrl);
      return;
    }

    const filePath = this.uploadService.getLocalFilePath(objectKey);
    if (!existsSync(filePath)) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    res.sendFile(filePath);
  }
}
