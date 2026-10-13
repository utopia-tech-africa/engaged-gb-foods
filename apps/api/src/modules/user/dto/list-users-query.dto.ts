import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ListUsersQueryDto {
  @ApiPropertyOptional({ enum: UserRole, enumName: "UserRole", description: "Filter by role" })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Filter by active flag. Omit to return active and inactive users.",
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === "") {
      return undefined;
    }
    return value === true || value === "true";
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Case-insensitive search on name, staff ID, or email" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
