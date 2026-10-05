import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { JwtUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateTerritoryDto) {
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
