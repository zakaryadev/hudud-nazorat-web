import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Post()
  create(@CurrentUser() u: JwtUser, @Body() dto: CreateUserDto) {
    return this.users.create(u.orgId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() u: JwtUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(u.orgId, u.userId, id, dto);
  }

  @Get()
  list(@CurrentUser() u: JwtUser) {
    return this.users.list(u.orgId);
  }
}
