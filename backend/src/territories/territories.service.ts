import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { JwtUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  private async assertOrgUsers(orgId: string, ids: string[]) {
    if (!ids.length) return;
    const n = await this.prisma.user.count({ where: { id: { in: ids }, orgId } });
    if (n !== new Set(ids).size) throw new BadRequestException("Xodimlar ro'yxatida noto'g'ri foydalanuvchi bor");
  }

  async setAssignees(orgId: string, id: string, ids: string[]) {
    const t = await this.prisma.territory.findUnique({ where: { id } });
    if (!t || t.orgId !== orgId) throw new NotFoundException('Hudud topilmadi');
    await this.assertOrgUsers(orgId, ids);
    return this.prisma.territory.update({
      where: { id },
      data: { assignees: { set: ids.map((uid) => ({ id: uid })) } },
      include: { assignees: { select: { id: true, fullName: true } } },
    });
  }

  async create(orgId: string, dto: CreateTerritoryDto) {
    await this.assertOrgUsers(orgId, dto.assigneeIds ?? []);
    return this.prisma.territory.create({
      data: {
        orgId,
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusM: dto.radiusM ?? 150,
        assignees: dto.assigneeIds?.length
          ? { connect: dto.assigneeIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  // ADMIN — barcha hududlar; EMPLOYEE — faqat biriktirilganlari
  async list(user: JwtUser) {
    if (user.role === 'ADMIN') {
      return this.prisma.territory.findMany({
        where: { orgId: user.orgId },
        orderBy: { createdAt: 'desc' },
        include: { assignees: { select: { id: true, fullName: true } } },
      });
    }
    return this.prisma.territory.findMany({
      where: { orgId: user.orgId, assignees: { some: { id: user.userId } } },
      orderBy: { name: 'asc' },
    });
  }

  async getOne(user: JwtUser, id: string) {
    const t = await this.prisma.territory.findUnique({ where: { id } });
    if (!t || t.orgId !== user.orgId) throw new NotFoundException('Hudud topilmadi');
    return t;
  }

  async assertAssigned(user: JwtUser, territoryId: string) {
    const t = await this.getOne(user, territoryId);
    if (user.role === 'ADMIN') return t;
    const assigned = await this.prisma.territory.findFirst({
      where: { id: territoryId, assignees: { some: { id: user.userId } } },
    });
    if (!assigned) throw new ForbiddenException('Bu hudud sizga biriktirilmagan');
    return t;
  }
}
