import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export const setupSwagger = (app: INestApplication, prefix: string): void => {
  const config = new DocumentBuilder()
    .setTitle("GBfoods Stock Control API")
    .setDescription(
      "Field and client API for the GBfoods nationwide depot sorting and segregation programme.",
    )
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    jsonDocumentUrl: `${prefix}/docs-json`,
  });
};
