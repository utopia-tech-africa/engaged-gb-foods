import { plainToInstance } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min, validateSync } from "class-validator";

export class EnvironmentVariables {
  @IsString()
  HOST = "0.0.0.0";

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  @IsString()
  CORS_ORIGINS = "http://localhost:3000";

  @IsString()
  DATABASE_URL!: string;

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
