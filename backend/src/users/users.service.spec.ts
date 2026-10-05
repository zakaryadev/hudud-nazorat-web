import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = { user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() } };
  const svc = new UsersService(prisma as any);

  beforeEach(() => {
    prisma.user.findUnique.mockReset();
    prisma.user.create.mockReset();
    prisma.user.update.mockReset();
  });

  it('telefon band bo\'lsa 409 (FR-6.2)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'x' });
    await expect(
      svc.create('o1', { fullName: 'A', phone: '+998900000001', password: 'abcd' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('parol bcrypt hash sifatida saqlanadi (FR-1.6)', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({ id: 'n', ...data }));
    await svc.create('o1', { fullName: 'A', phone: '+998900000001', password: 'abcd1234' } as any);
    const hash = prisma.user.create.mock.calls[0][0].data.passwordHash;
    expect(hash).not.toContain('abcd1234');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('boshqa tashkilot xodimini o\'zgartirib bo\'lmaydi (404)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', orgId: 'boshqa' });
    await expect(svc.update('o1', 'a1', 'u2', { isActive: false })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('admin o\'zini nofaol qila olmaydi / rolini pasaytira olmaydi', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'a1', orgId: 'o1' });
    await expect(svc.update('o1', 'a1', 'a1', { isActive: false })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.update('o1', 'a1', 'a1', { role: 'EMPLOYEE' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('boshqa xodimni nofaol qilish ishlaydi', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', orgId: 'o1' });
    prisma.user.update.mockResolvedValue({ id: 'u2', fullName: 'B', phone: 'p', role: 'EMPLOYEE', isActive: false });
    await expect(svc.update('o1', 'a1', 'u2', { isActive: false })).resolves.toMatchObject({ isActive: false });
  });
});
