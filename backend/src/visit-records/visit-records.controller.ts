import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VisitRecordsService } from './visit-records.service';
import { CreateVisitRecordDto } from './dto/create-visit-record.dto';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
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
}
