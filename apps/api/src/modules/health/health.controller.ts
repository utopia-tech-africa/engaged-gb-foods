import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import type { HealthService } from "./health.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    operationId: "getHealth",
    summary: "Get API health",
    description: "Returns process health and a lightweight database connectivity check.",
  })
  getHealth() {
    return this.healthService.getHealth();
  }
}
