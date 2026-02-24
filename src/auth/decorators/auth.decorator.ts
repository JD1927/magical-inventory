import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import { Roles } from './roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';

export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(AuthGuard('jwt'), UserRoleGuard),
  );
}
