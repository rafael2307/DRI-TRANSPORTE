import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, UserRole } from '../auth.service';

@Injectable()
  export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
          configService: ConfigService,
          private authService: AuthService,
        ) {
          const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
          const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
          if (!clientID || !clientSecret) {
                  // Sin estas variables, passport-oauth2 lanza un error al construir la
            // estrategia y se cae TODA la app (no solo el login con Google). Se usa
            // un placeholder para que Nest arranque igual; cualquier intento real
            // de login con Google simplemente fallará del lado de Google hasta que
            // se configuren GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET.
            Logger.warn(
                      'GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET no configurados — login con Google deshabilitado.',
                      'GoogleStrategy',
                    );
          }
          super({
                  clientID: clientID || 'not-configured',
                  clientSecret: clientSecret || 'not-configured',
                  callbackURL:
                            configService.get<string>('GOOGLE_CALLBACK_URL') ||
                            'http://localhost:3000/auth/google/callback',
                  scope: ['email', 'profile'],
                  passReqToCallback: true,
          });
    }

  async validate(
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
      ): Promise<any> {
        const { name, emails, id } = profile;
        const role = req.query?.state || req.query?.role || UserRole.PASSENGER;

      const user = await this.authService.socialLogin({
              provider: 'google',
              providerId: id,
              email: emails[0].value,
              name: `${name.givenName} ${name.familyName}`,
              role: role as UserRole,
      });
        done(null, user);
  }
}
