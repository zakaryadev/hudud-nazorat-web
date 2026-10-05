import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AttendanceModule } from '../attendance/attendance.module';
import { JwtStrategy } from './jwt.strategy';
import { jwtSecret } from '../common/config';

@Module({
  imports: [
    PassportModule,
    AttendanceModule,
    JwtModule.register({
      secret: jwtSecret(),
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
