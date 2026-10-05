import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TerritoriesService } from '../territories/territories.service';
import { CreateVisitRecordDto } from './dto/create-visit-record.dto';
import { ReportQueryDto, dateFilter } from '../common/dto/report-query.dto';
import { JwtUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class VisitRecordsService {
  constructor(private prisma: PrismaService, private territories: TerritoriesService) {}

  async create(user: JwtUser, dto: CreateVisitRecordDto) {
    if (dto.territoryId) {
      await this.territories.getOne(user, dto.territoryId); // tashkilotga tegishliligini tekshir
    }
    return this.prisma.visitRecord.create({
      data: {
        userId: user.userId,
        territoryId: dto.territoryId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        address: dto.address,
        photoUrl: dto.photoUrl,
        comment: dto.comment,
      },
    });
  }

  async myList(user: JwtUser, limit = 50) {
    return this.prisma.visitRecord.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: { territory: { select: { id: true, name: true } } },
    });
  }

  // ADMIN — tashkilot bo'yicha hisobotlar (filtrlar: sana oralig'i, xodim, hudud)
  async orgList(user: JwtUser, q: ReportQueryDto = {}) {
    return this.prisma.visitRecord.findMany({
      where: {
        user: { orgId: user.orgId },
        ...(q.userId ? { userId: q.userId } : {}),
        ...(q.territoryId ? { territoryId: q.territoryId } : {}),
        ...dateFilter('createdAt', q.from, q.to),
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit ?? 200,
      include: {
        territory: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }
}
