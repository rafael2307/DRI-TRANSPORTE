import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  sub: string; // user id
  username: string;
  role: string;
}

// Pulls the authenticated user off the request. Only valid on routes guarded
// with JwtAuthGuard, which is what populates request.user.
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
