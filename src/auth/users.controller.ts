import { Controller, Get, Param, Post } from '@nestjs/common';
import { Auth } from './decorators/auth.decorator';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Auth(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Post(':id/toggle-active')
  @Auth(UserRole.ADMIN)
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
