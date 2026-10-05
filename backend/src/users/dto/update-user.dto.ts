import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() @MinLength(4) password?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsEnum({ ADMIN: 'ADMIN', EMPLOYEE: 'EMPLOYEE' } as any)
  role?: 'ADMIN' | 'EMPLOYEE';
}
