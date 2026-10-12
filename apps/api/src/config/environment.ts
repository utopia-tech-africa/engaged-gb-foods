import { plainToInstance, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min, MinLength, validateSync } from "class-validator";

export class EnvironmentVariables {
  @IsString()
  HOST = "0.0.0.0";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  @IsString()
  CORS_ORIGINS = "http://localhost:3000";

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  JWT_ACCESS_TTL_SECONDS = 900;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  JWT_REFRESH_TTL_DAYS = 14;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;
}

export const validateEnvironment = (config: Record<string, unknown>): EnvironmentVariables => {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
};
