import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
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

  @Get()
  list(@CurrentUser() u: JwtUser) {
    return this.users.list(u.orgId);
  }
}
