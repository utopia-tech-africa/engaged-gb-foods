import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class ListUsersQueryDto {
  @ApiPropertyOptional({ enum: UserRole, description: "Filter by role" })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
