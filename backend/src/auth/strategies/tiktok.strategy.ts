import { PassportStrategy } from '@nestjs/passport';
// @ts-ignore
const Strategy: any = class {
    name = 'tiktok';
    constructor(o: any, v: any) {}
};
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, UserRole } from '../auth.service';

@Injectable()
  export class TiktokStrategy extends PassportStrategy(Strategy, 'tiktok') {
    constructor(
          configService: ConfigService,
          private authService: AuthService,
        ) {
          const clientID = configService.get<string>('TIKTOK_CLIENT_ID');
          const clientSecret = configService.get<string>('TIKTOK_CLIENT_SECRET');
          if (!clientID || !clientSecret) {
                  // Ver nota equivalente en google.strategy.ts. Además, esta estrategia
            // hoy es un stub (la clase Strategy de arriba es un placeholder, no la
            // librería real de TikTok) — login con TikTok no está implementado de
            // verdad todavía, más allá de este fix de arranque.
            Logger.warn(
                      'TIKTOK_CLIENT_ID/TIKTOK_CLIENT_SECRET no configurados — login con TikTok deshabilitado (además, la integración real aún no está implementada).',
                      'TiktokStrategy',
                    );
          }
          super({
                  clientID: clientID || 'not-configured',
                  clientSecret: clientSecret || 'not-configured',
                  callbackURL:
                            configService.get<string>('TIKTOK_CALLBACK_URL') ||
                            'http://localhost:3000/auth/tiktok/callback',
                  scope: ['user.info.basic'],
                  passReqToCallback: true,
          });
    }

  async validate(
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (err: any, user: any, info?: any) => void,
      ): Promise<any> {
        const { id, display_name } = profile;
        const role = req.query?.state || req.query?.role || UserRole.PASSENGER;

      const user = await this.authService.socialLogin({
              provider: 'tiktok',
              providerId: id,
              name: display_name,
              role: role as UserRole,
      });
        done(null, user);
  }
}
