import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { jwtSecret } from '../common/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  // Har so'rovda holatni bazadan tekshiramiz: nofaol yoki o'chirilgan xodim tokeni darhol ishlamaydi,
  // rol/tashkilot o'zgarsa ham joriy qiymat olinadi
  async validate(payload: any): Promise<JwtUser> {
    if (!payload?.sub) throw new UnauthorizedException();
    const u = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, orgId: true, role: true, isActive: true },
    });
    if (!u || !u.isActive) throw new UnauthorizedException();
    return { userId: u.id, orgId: u.orgId, role: u.role };
  }
}
