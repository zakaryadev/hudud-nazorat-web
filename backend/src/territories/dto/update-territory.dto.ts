import { IsBoolean, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateTerritoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
  @IsOptional() @IsInt() @Min(20) @Max(5000) radiusM?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
