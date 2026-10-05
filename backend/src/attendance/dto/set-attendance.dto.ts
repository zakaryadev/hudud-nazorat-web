import { IsLatitude, IsLongitude, IsNumber, IsOptional, IsString } from 'class-validator';

export class SetAttendanceDto {
  @IsString() territoryId: string;
  @IsLatitude() latitude: number;
  @IsLongitude() longitude: number;
  @IsOptional() @IsNumber() accuracy?: number;
  @IsOptional() @IsString() photoUrl?: string;
}
