import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VisitRecordsService } from './visit-records.service';
import { CreateVisitRecordDto } from './dto/create-visit-record.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('visit-records')
export class VisitRecordsController {
  constructor(private svc: VisitRecordsService) {}

  @Post('create')
  create(@CurrentUser() u: JwtUser, @Body() dto: CreateVisitRecordDto) {
    return this.svc.create(u, dto);
  }

  @Get('my-records-list')
  my(@CurrentUser() u: JwtUser, @Query('limit') limit?: string) {
    return this.svc.myList(u, limit ? Number(limit) : 50);
  }

  @Roles('ADMIN')
  @Get('org')
  org(@CurrentUser() u: JwtUser, @Query('limit') limit?: string) {
    return this.svc.orgList(u, limit ? Number(limit) : 100);
  }
}
