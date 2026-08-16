import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Protects HTTP routes using the 'jwt' Passport strategy already registered
// in JwtStrategy (src/auth/strategies/jwt.strategy.ts). On success it
// attaches `{ sub, username, role }` to `request.user`.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
