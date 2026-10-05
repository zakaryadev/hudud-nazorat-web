import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate (FR-1.4)', () => {
  const prisma = { user: { findUnique: jest.fn() } };
  let strategy: JwtStrategy;

  beforeAll(() => {
    process.env.JWT_SECRET = '0123456789abcdef0123';
    strategy = new JwtStrategy(prisma as any);
  });
  beforeEach(() => prisma.user.findUnique.mockReset());

  it('sub yo\'q -> 401', async () => {
    await expect(strategy.validate({})).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('foydalanuvchi topilmadi -> 401', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 'u1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('nofaol foydalanuvchi tokeni -> 401', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', orgId: 'o1', role: 'EMPLOYEE', isActive: false });
    await expect(strategy.validate({ sub: 'u1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('faol foydalanuvchi: rol va tashkilot bazadan olinadi (tokendagisi emas)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', orgId: 'o1', role: 'EMPLOYEE', isActive: true });
    await expect(strategy.validate({ sub: 'u1', role: 'ADMIN', orgId: 'boshqa' })).resolves.toEqual({
      userId: 'u1',
      orgId: 'o1',
      role: 'EMPLOYEE',
    });
  });
});
