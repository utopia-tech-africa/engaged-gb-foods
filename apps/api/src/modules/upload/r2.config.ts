import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class R2Config {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return (
      Boolean(this.configService.get<string>("R2_ACCOUNT_ID")) &&
      Boolean(this.configService.get<string>("R2_ACCESS_KEY_ID")) &&
      Boolean(this.configService.get<string>("R2_SECRET_ACCESS_KEY")) &&
      Boolean(this.configService.get<string>("R2_BUCKET")) &&
      Boolean(this.configService.get<string>("R2_PUBLIC_BASE_URL"))
    );
  }

  get accountId(): string {
    return this.configService.get<string>("R2_ACCOUNT_ID") ?? "";
  }

  get accessKeyId(): string {
    return this.configService.get<string>("R2_ACCESS_KEY_ID") ?? "";
  }

  get secretAccessKey(): string {
    return this.configService.get<string>("R2_SECRET_ACCESS_KEY") ?? "";
  }

  get bucket(): string {
    return this.configService.get<string>("R2_BUCKET") ?? "";
  }

  get publicBaseUrl(): string {
    const base = this.configService.get<string>("R2_PUBLIC_BASE_URL") ?? "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
  }
}
