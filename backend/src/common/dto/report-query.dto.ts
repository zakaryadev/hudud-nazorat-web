import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class ReportQueryDto {
  @IsOptional() @Matches(DATE, { message: "from YYYY-MM-DD ko'rinishida bo'lsin" }) from?: string;
  @IsOptional() @Matches(DATE, { message: "to YYYY-MM-DD ko'rinishida bo'lsin" }) to?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() territoryId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit?: number;
}

export class DailyQueryDto {
  @IsOptional() @Matches(DATE, { message: "date YYYY-MM-DD ko'rinishida bo'lsin" }) date?: string;
}

// from/to (kun, ikkalasi ham kiritiladi) -> Date oralig'i filtri
export function dateFilter(field: string, from?: string, to?: string) {
  const f: any = {};
  if (from) f.gte = new Date(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  if (to) f.lt = new Date(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)) + 1);
  return Object.keys(f).length ? { [field]: f } : {};
}
