import { IsArray, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTerritoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() address?: string;
  @IsLatitude() latitude: number;
  @IsLongitude() longitude: number;
  @IsOptional() @IsInt() @Min(20) @Max(5000) radiusM?: number;
  @IsOptional() @IsArray() assigneeIds?: string[];
}
