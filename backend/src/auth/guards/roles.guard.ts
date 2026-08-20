import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtUser } from '../decorators/current-user.decorator';

// Reads the roles set by @Roles(...) on the handler/class and compares them
// against request.user.role, which JwtAuthGuard populates from the JWT
// payload (see JwtStrategy). Must run AFTER JwtAuthGuard in @UseGuards(),
// e.g. @UseGuards(JwtAuthGuard, RolesGuard).
@Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
                ROLES_KEY,
                [context.getHandler(), context.getClass()],
              );

      if (!requiredRoles || requiredRoles.length === 0) {
              return true;
      }

      const request = context.switchToHttp().getRequest();
        const user: JwtUser | undefined = request.user;

      if (!user || !requiredRoles.includes(user.role)) {
              throw new ForbiddenException(
                        `Se requiere uno de estos roles: ${requiredRoles.join(', ')}`,
                      );
      }

      return true;
  }
}
