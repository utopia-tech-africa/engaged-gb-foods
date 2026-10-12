import "reflect-metadata";

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "../app.module";

const exportOpenApi = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle("GBfoods Stock Control API")
    .setDescription(
      "Field and client API for the GBfoods nationwide depot sorting and segregation programme.",
    )
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const outDir = join(process.cwd(), "openapi");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "openapi.json"), `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
};

void exportOpenApi();
