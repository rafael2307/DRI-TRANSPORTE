import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, UserRole } from '../auth.service';

@Injectable()
  export class KwaiStrategy extends PassportStrategy(Strategy, 'kwai') {
    constructor(
          configService: ConfigService,
          private authService: AuthService,
        ) {
          const clientID = configService.get<string>('KWAI_CLIENT_ID');
          const clientSecret = configService.get<string>('KWAI_CLIENT_SECRET');
          const authorizationURL = configService.get<string>(
                  'KWAI_AUTHORIZATION_URL',
                );
          const tokenURL = configService.get<string>('KWAI_TOKEN_URL');
          if (!clientID || !clientSecret || !authorizationURL || !tokenURL) {
                  // Ver nota equivalente en google.strategy.ts: sin esto, passport-oauth2
            // tira toda la app abajo al arrancar, no solo el login con Kwai.
            Logger.warn(
                      'Variables KWAI_* no configuradas — login con Kwai deshabilitado.',
                      'KwaiStrategy',
                    );
          }
          super({
                  authorizationURL: authorizationURL || 'https://example.com/authorize',
                  tokenURL: tokenURL || 'https://example.com/token',
                  clientID: clientID || 'not-configured',
                  clientSecret: clientSecret || 'not-configured',
                  callbackURL:
                            configService.get<string>('KWAI_CALLBACK_URL') ||
                            'http://localhost:3000/auth/kwai/callback',
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
        const role = req.query?.state || req.query?.role || UserRole.PASSENGER;

      // Note: Since this is a generic OAuth2 strategy, we might need to fetch the profile manually
      // if the strategy doesn't handle it. For now, we assume profile has the necessary info.
      const user = await this.authService.socialLogin({
              provider: 'kwai',
              providerId: profile.id,
              email: profile.email,
              name: profile.name,
              role: role as UserRole,
      });
        done(null, user);
  }
}
