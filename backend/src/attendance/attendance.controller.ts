import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { SetAttendanceDto } from './dto/set-attendance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  @Post('set')
  set(@CurrentUser() u: JwtUser, @Body() dto: SetAttendanceDto) {
    return this.svc.setAttendance(u, dto);
  }

  @Get('my')
  my(@CurrentUser() u: JwtUser, @Query('limit') limit?: string) {
    return this.svc.myList(u, limit ? Number(limit) : 50);
  }

  @Roles('ADMIN')
  @Get('org')
  org(@CurrentUser() u: JwtUser, @Query('limit') limit?: string) {
    return this.svc.orgList(u, limit ? Number(limit) : 100);
  }
}
