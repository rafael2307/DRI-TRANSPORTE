import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Marks a route as requiring one of the given roles. Combine with RolesGuard:
// @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
