import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, UserRole } from '../auth.service';

@Injectable()
  export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(
          configService: ConfigService,
          private authService: AuthService,
        ) {
          const clientID = configService.get<string>('FACEBOOK_CLIENT_ID');
          const clientSecret = configService.get<string>('FACEBOOK_CLIENT_SECRET');
          if (!clientID || !clientSecret) {
                  // Ver nota equivalente en google.strategy.ts: sin esto, passport-oauth2
            // tira toda la app abajo al arrancar, no solo el login con Facebook.
            Logger.warn(
                      'FACEBOOK_CLIENT_ID/FACEBOOK_CLIENT_SECRET no configurados — login con Facebook deshabilitado.',
                      'FacebookStrategy',
                    );
          }
          super({
                  clientID: clientID || 'not-configured',
                  clientSecret: clientSecret || 'not-configured',
                  callbackURL:
                            configService.get<string>('FACEBOOK_CALLBACK_URL') ||
                            'http://localhost:3000/auth/facebook/callback',
                  scope: ['email', 'public_profile'],
                  profileFields: ['id', 'emails', 'name', 'displayName'],
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
        const { id, displayName, emails } = profile;
        const role = req.query?.state || req.query?.role || UserRole.PASSENGER;

      const user = await this.authService.socialLogin({
              provider: 'facebook',
              providerId: id,
              email: emails && emails.length > 0 ? emails[0].value : undefined,
              name: displayName,
              role: role as UserRole,
      });
        done(null, user);
  }
}
