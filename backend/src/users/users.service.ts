import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Bu telefon raqam band');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        orgId,
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash,
        role: dto.role || 'EMPLOYEE',
      },
    });
    return { id: user.id, fullName: user.fullName, phone: user.phone, role: user.role };
  }

  async list(orgId: string) {
    const users = await this.prisma.user.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    return users;
  }
}
