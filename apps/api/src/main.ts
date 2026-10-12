import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";
import type { EnvironmentVariables } from "./config/environment";
import { setupSwagger } from "./config/swagger";

const bootstrap = async (): Promise<void> => {
  const prefix = "/api/v1";
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const host = configService.get("HOST", { infer: true });
  const port = configService.get("PORT", { infer: true });
  const corsOrigins = configService
    .get("CORS_ORIGINS", { infer: true })
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix(prefix);
  setupSwagger(app, prefix);
  await app.listen(port, host);

  Logger.log(`API running on http://${host}:${port}`, "Bootstrap");
  Logger.log(`Swagger UI available at http://${host}:${port}${prefix}/docs`, "Swagger");
  Logger.log(`OpenAPI JSON available at http://${host}:${port}${prefix}/docs-json`, "Swagger");
};

void bootstrap();
