import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TerritoriesService } from '../territories/territories.service';
import { haversineMeters } from '../common/utils/geo';
import { SetAttendanceDto } from './dto/set-attendance.dto';
import { JwtUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private territories: TerritoriesService) {}

  async setAttendance(user: JwtUser, dto: SetAttendanceDto) {
    const territory = await this.territories.assertAssigned(user, dto.territoryId);

    // Geofence tekshiruvi
    const distanceM = haversineMeters(
      dto.latitude,
      dto.longitude,
      territory.latitude,
      territory.longitude,
    );
    const withinZone = distanceM <= territory.radiusM;

    const att = await this.prisma.attendance.create({
      data: {
        userId: user.userId,
        territoryId: territory.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        distanceM: Math.round(distanceM),
        withinZone,
        photoUrl: dto.photoUrl,
      },
    });

    return {
      id: att.id,
      checkInAt: att.checkInAt,
      distanceM: att.distanceM,
      withinZone: att.withinZone,
      territory: { id: territory.id, name: territory.name, radiusM: territory.radiusM },
      message: withinZone
        ? 'Davomat belgilandi — hudud ichidasiz'
        : `Diqqat: hududdan ${att.distanceM} m uzoqdasiz (ruxsat: ${territory.radiusM} m)`,
    };
  }

  async myList(user: JwtUser, limit = 50) {
    return this.prisma.attendance.findMany({
      where: { userId: user.userId },
      orderBy: { checkInAt: 'desc' },
      take: Math.min(limit, 200),
      include: { territory: { select: { id: true, name: true } } },
    });
  }

  // ADMIN — tashkilot bo'yicha barcha davomat
  async orgList(user: JwtUser, limit = 100) {
    return this.prisma.attendance.findMany({
      where: { territory: { orgId: user.orgId } },
      orderBy: { checkInAt: 'desc' },
      take: Math.min(limit, 500),
      include: {
        territory: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }
}
