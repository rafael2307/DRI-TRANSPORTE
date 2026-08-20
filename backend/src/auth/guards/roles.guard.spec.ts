import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

           const buildContext = (role) => {
                 const request = {
                         user: role ? { sub: 'u1', username: 'u1', role } : undefined,
                 };
                 return {
                         switchToHttp: () => ({ getRequest: () => request }),
                         getHandler: () => ({}),
                         getClass: () => ({}),
                 };
           };

           beforeEach(() => {
                 reflector = new Reflector();
                 guard = new RolesGuard(reflector);
           });

           it('allows the request when the route has no @Roles()', () => {
                 jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
                 expect(guard.canActivate(buildContext('passenger'))).toBe(true);
           });

           it('allows the request when the user has one of the required roles', () => {
                 jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
                 expect(guard.canActivate(buildContext('admin'))).toBe(true);
           });

           it('rejects the request when the user role is not allowed', () => {
                 jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
                 expect(() => guard.canActivate(buildContext('passenger'))).toThrow(
                         ForbiddenException,
                       );
           });

           it('rejects the request when there is no authenticated user', () => {
                 jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
                 expect(() => guard.canActivate(buildContext(undefined))).toThrow(
                         ForbiddenException,
                       );
           });
});
