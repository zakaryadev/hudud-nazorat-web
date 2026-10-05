import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TerritoriesService } from './territories.service';

describe('TerritoriesService.assertAssigned (FR-3.5)', () => {
  const prisma = { territory: { findUnique: jest.fn(), findFirst: jest.fn() } };
  const svc = new TerritoriesService(prisma as any);
  const t = { id: 't1', orgId: 'o1', isActive: true };
  const employee = { userId: 'u1', orgId: 'o1', role: 'EMPLOYEE' as const };
  const admin = { userId: 'a1', orgId: 'o1', role: 'ADMIN' as const };

  beforeEach(() => {
    prisma.territory.findUnique.mockReset().mockResolvedValue(t);
    prisma.territory.findFirst.mockReset();
  });

  it('biriktirilgan xodim — ruxsat', async () => {
    prisma.territory.findFirst.mockResolvedValue(t);
    await expect(svc.assertAssigned(employee, 't1')).resolves.toBe(t);
  });
  it('biriktirilmagan xodim — 403', async () => {
    prisma.territory.findFirst.mockResolvedValue(null);
    await expect(svc.assertAssigned(employee, 't1')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('admin — biriktirilmasa ham ruxsat (o\'z tashkilotida)', async () => {
    await expect(svc.assertAssigned(admin, 't1')).resolves.toBe(t);
  });
  it('boshqa tashkilot hududi — 404', async () => {
    prisma.territory.findUnique.mockResolvedValue({ ...t, orgId: 'boshqa' });
    await expect(svc.assertAssigned(admin, 't1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
