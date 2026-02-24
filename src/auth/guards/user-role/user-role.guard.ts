import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User, UserRole } from '../../entities/user.entity';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { IRequestWithUser } from '../../models/user.model';

@Injectable()
export class UserRoleGuard implements CanActivate {
  private readonly logger = new Logger(UserRoleGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const userRoles: UserRole[] = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (userRoles.length === 0) {
      throw new InternalServerErrorException(
        'No roles metadata found for this route.',
      );
    }

    const request: IRequestWithUser = context.switchToHttp().getRequest();

    const user: User | undefined = request.user;

    if (!user) {
      this.logger.error(
        'User not found in request context. Ensure that the user is authenticated.',
      );
      throw new InternalServerErrorException(
        'User not found in request context.',
      );
    }

    if (!user.role) {
      this.logger.error(`User with ID ${user.id} has no roles assigned.`);
      throw new InternalServerErrorException('User has no roles assigned.');
    }

    if (userRoles.includes(user.role)) return true;

    throw new ForbiddenException(
      `User with role [${user.role}] is not allowed to access this resource.`,
    );
  }
}
