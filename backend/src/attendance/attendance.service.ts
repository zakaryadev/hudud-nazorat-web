import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TerritoriesService } from '../territories/territories.service';
import { haversineMeters } from '../common/utils/geo';
import { SetAttendanceDto } from './dto/set-attendance.dto';
import { ReportQueryDto, dateFilter } from '../common/dto/report-query.dto';
import { dayRange, dayStatus, today } from '../common/utils/day';
import { JwtUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private territories: TerritoriesService) {}

  async setAttendance(user: JwtUser, dto: SetAttendanceDto) {
    const territory = await this.territories.assertAssigned(user, dto.territoryId);
    if (!territory.isActive) {
      throw new BadRequestException('Bu hudud faol emas — davomat qabul qilinmaydi');
    }

    // Geofence tekshiruvi
    const distanceM = haversineMeters(
      dto.latitude,
      dto.longitude,
      territory.latitude,
      territory.longitude,
    );
    const withinZone = distanceM <= territory.radiusM;

    // Kuniga faqat birinchi muvaffaqiyatli (hudud ichidagi) belgilash saqlanadi.
    // Xodim qayta bossa — yangi yozuv yaratilmaydi, mavjud yozuv qaytariladi.
    // Ketma-ket ikki so'rov poygasiga qarshi foydalanuvchi bo'yicha advisory lock.
    const { start, end } = dayRange(today());
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.userId}))`;

      const first = await tx.attendance.findFirst({
        where: { userId: user.userId, withinZone: true, checkInAt: { gte: start, lt: end } },
        orderBy: { checkInAt: 'asc' },
        include: { territory: { select: { id: true, name: true, radiusM: true } } },
      });
      if (first) {
        return {
          id: first.id,
          checkInAt: first.checkInAt,
          distanceM: first.distanceM,
          withinZone: true,
          alreadyMarked: true,
          territory: first.territory,
          message: 'Bugun davomat allaqachon belgilangan',
        };
      }

      const att = await tx.attendance.create({
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
        alreadyMarked: false,
        territory: { id: territory.id, name: territory.name, radiusM: territory.radiusM },
        message: withinZone
          ? 'Davomat belgilandi — hududdasiz'
          : `Diqqat: hududdan ${att.distanceM} m uzoqdasiz (ruxsat: ${territory.radiusM} m)`,
      };
    });
  }

  async myList(user: JwtUser, limit = 50) {
    return this.prisma.attendance.findMany({
      where: { userId: user.userId },
      orderBy: { checkInAt: 'desc' },
      take: Math.min(limit, 200),
      include: { territory: { select: { id: true, name: true } } },
    });
  }

  // ADMIN — tashkilot bo'yicha davomat (filtrlar: sana oralig'i, xodim, hudud)
  async orgList(user: JwtUser, q: ReportQueryDto = {}) {
    return this.prisma.attendance.findMany({
      where: {
        territory: { orgId: user.orgId },
        ...(q.userId ? { userId: q.userId } : {}),
        ...(q.territoryId ? { territoryId: q.territoryId } : {}),
        ...dateFilter('checkInAt', q.from, q.to),
      },
      orderBy: { checkInAt: 'desc' },
      take: q.limit ?? 200,
      include: {
        territory: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }

  // ADMIN — kunlik kesim: har bir faol xodim uchun holat (FR-7.1)
  async daily(user: JwtUser, date = today()) {
    const { start, end } = dayRange(date);
    const [employees, rows] = await Promise.all([
      this.prisma.user.findMany({
        where: { orgId: user.orgId, role: 'EMPLOYEE', isActive: true },
        orderBy: { fullName: 'asc' },
        select: { id: true, fullName: true, phone: true },
      }),
      this.prisma.attendance.findMany({
        where: { territory: { orgId: user.orgId }, checkInAt: { gte: start, lt: end } },
        orderBy: { checkInAt: 'asc' },
        include: { territory: { select: { name: true } } },
      }),
    ]);
    const items = employees.map((e) => {
      const mine = rows.filter((r) => r.userId === e.id);
      const last = mine[mine.length - 1];
      return {
        user: e,
        status: dayStatus(mine),
        attempts: mine.length,
        lastAt: last?.checkInAt ?? null,
        lastTerritory: last?.territory.name ?? null,
        lastDistanceM: last?.distanceM ?? null,
        minAccuracy: mine.reduce<number | null>(
          (m, r) => (r.accuracy == null ? m : m == null ? r.accuracy : Math.min(m, r.accuracy)),
          null,
        ),
      };
    });
    return {
      date,
      summary: {
        total: items.length,
        inside: items.filter((i) => i.status === 'INSIDE').length,
        outsideOnly: items.filter((i) => i.status === 'OUTSIDE_ONLY').length,
        none: items.filter((i) => i.status === 'NONE').length,
      },
      items,
    };
  }

  // Joriy xodimning bugungi holati (bosh ekran)
  async todayStatus(userId: string) {
    const { start, end } = dayRange(today());
    const rows = await this.prisma.attendance.findMany({
      where: { userId, checkInAt: { gte: start, lt: end } },
      orderBy: { checkInAt: 'desc' },
    });
    return { status: dayStatus(rows), attempts: rows.length, lastAt: rows[0]?.checkInAt ?? null };
  }
}
