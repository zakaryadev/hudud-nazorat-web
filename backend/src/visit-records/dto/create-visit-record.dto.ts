import { IsLatitude, IsLongitude, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVisitRecordDto {
  @IsOptional() @IsString() territoryId?: string;
  @IsLatitude() latitude: number;
  @IsLongitude() longitude: number;
  @IsOptional() @IsNumber() accuracy?: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() comment?: string;
}
