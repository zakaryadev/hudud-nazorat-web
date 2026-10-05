import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() fullName: string;
  @IsString() phone: string;
  @IsString() @MinLength(4) password: string;
  @IsOptional() @IsEnum({ ADMIN: 'ADMIN', EMPLOYEE: 'EMPLOYEE' } as any)
  role?: 'ADMIN' | 'EMPLOYEE';
}
