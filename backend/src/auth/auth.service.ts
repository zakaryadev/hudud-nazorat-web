import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private attendance: AttendanceService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: { org: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Login yoki parol xato');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Login yoki parol xato');

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      orgId: user.orgId,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        org: { id: user.org.id, name: user.org.name },
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { org: true, assignedTerritory: true },
    });
    if (!user) throw new UnauthorizedException();
    const todayStatus = await this.attendance.todayStatus(user.id);
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      org: { id: user.org.id, name: user.org.name },
      todayStatus,
      territories: user.assignedTerritory.filter((t) => t.isActive).map((t) => ({
        id: t.id,
        name: t.name,
        latitude: t.latitude,
        longitude: t.longitude,
        radiusM: t.radiusM,
        address: t.address,
      })),
    };
  }
}
