import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

describe('AttendanceService.setAttendance (FR-3.x)', () => {
  const prisma: any = { attendance: { create: jest.fn(), findFirst: jest.fn() }, $executeRaw: jest.fn() };
  prisma.$transaction = (fn: any) => fn(prisma);
  const territories = { assertAssigned: jest.fn() };
  const svc = new AttendanceService(prisma as any, territories as any);
  const user = { userId: 'u1', orgId: 'o1', role: 'EMPLOYEE' as const };
  const territory = { id: 't1', name: 'Nukus', latitude: 42.4531, longitude: 59.6103, radiusM: 150, isActive: true };
  const M = (6371000 * Math.PI) / 180;
  const at = (metersNorth: number) => ({
    territoryId: 't1',
    latitude: territory.latitude + metersNorth / M,
    longitude: territory.longitude,
    accuracy: 12,
  });

  beforeEach(() => {
    territories.assertAssigned.mockReset().mockResolvedValue(territory);
    prisma.attendance.findFirst.mockReset().mockResolvedValue(null);
    prisma.attendance.create.mockReset().mockImplementation(async ({ data }) => ({
      id: 'a1',
      checkInAt: new Date('2026-10-05T08:00:00Z'),
      ...data,
    }));
  });

  it('hudud ichida: withinZone=true, masofa saqlanadi', async () => {
    const r = await svc.setAttendance(user, at(34));
    expect(r.withinZone).toBe(true);
    expect(r.distanceM).toBe(34);
    expect(prisma.attendance.create.mock.calls[0][0].data).toMatchObject({ userId: 'u1', withinZone: true, accuracy: 12 });
  });

  it('hududdan tashqarida: rad etilmaydi, withinZone=false bilan saqlanadi, xabar masofa va ruxsatni aytadi', async () => {
    const r = await svc.setAttendance(user, at(320));
    expect(r.withinZone).toBe(false);
    expect(prisma.attendance.create).toHaveBeenCalledTimes(1);
    expect(r.message).toContain('320');
    expect(r.message).toContain('150');
  });

  it('biriktirilmagan hudud: 403 va yozuv yaratilmaydi', async () => {
    territories.assertAssigned.mockRejectedValue(new ForbiddenException());
    await expect(svc.setAttendance(user, at(0))).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.attendance.create).not.toHaveBeenCalled();
  });

  it('faol bo\'lmagan hudud: 400, yozuv yaratilmaydi (FR-2.5)', async () => {
    territories.assertAssigned.mockResolvedValue({ ...territory, isActive: false });
    await expect(svc.setAttendance(user, at(0))).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.attendance.create).not.toHaveBeenCalled();
  });

  it('kun ichida birinchi muvaffaqiyatli belgilash saqlanadi: qayta bosilsa yangi yozuv yaratilmaydi', async () => {
    const firstAt = new Date('2026-10-05T04:00:00Z');
    prisma.attendance.findFirst.mockResolvedValue({
      id: 'first',
      checkInAt: firstAt,
      distanceM: 20,
      withinZone: true,
      territory: { id: 't1', name: 'Nukus', radiusM: 150 },
    });
    const r = await svc.setAttendance(user, at(10));
    expect(r).toMatchObject({ id: 'first', checkInAt: firstAt, withinZone: true, alreadyMarked: true });
    expect(prisma.attendance.create).not.toHaveBeenCalled();
  });

  it('muvaffaqiyatsiz (tashqarida) urinishlardan keyin hudud ichidagisi baribir saqlanadi', async () => {
    const r = await svc.setAttendance(user, at(10));
    expect(r.alreadyMarked).toBe(false);
    expect(prisma.attendance.create).toHaveBeenCalledTimes(1);
  });
});
