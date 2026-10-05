import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TerritoriesService } from './territories.service';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('territories')
export class TerritoriesController {
  constructor(private svc: TerritoriesService) {}

  @Roles('ADMIN')
  @Post()
  create(@CurrentUser() u: JwtUser, @Body() dto: CreateTerritoryDto) {
    return this.svc.create(u.orgId, dto);
  }

  @Get()
  list(@CurrentUser() u: JwtUser) {
    return this.svc.list(u);
  }

  @Get(':id')
  getOne(@CurrentUser() u: JwtUser, @Param('id') id: string) {
    return this.svc.getOne(u, id);
  }
}
