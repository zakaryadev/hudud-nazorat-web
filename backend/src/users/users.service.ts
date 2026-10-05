import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async update(orgId: string, actorId: string, id: string, dto: UpdateUserDto) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u || u.orgId !== orgId) throw new NotFoundException('Xodim topilmadi');
    if (id === actorId && (dto.isActive === false || (dto.role && dto.role !== 'ADMIN'))) {
      throw new BadRequestException("O'zingizni nofaol qilib yoki rolingizni pasaytirib bo'lmaydi");
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        isActive: dto.isActive,
        role: dto.role,
        passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
      },
    });
    return { id: user.id, fullName: user.fullName, phone: user.phone, role: user.role, isActive: user.isActive };
  }
}
