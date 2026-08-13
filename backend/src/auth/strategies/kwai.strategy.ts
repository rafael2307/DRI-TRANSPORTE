import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, UserRole } from '../auth.service';

@Injectable()
export class KwaiStrategy extends PassportStrategy(Strategy, 'kwai') {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      authorizationURL: configService.get<string>('KWAI_AUTHORIZATION_URL')!,
      tokenURL: configService.get<string>('KWAI_TOKEN_URL')!,
      clientID: configService.get<string>('KWAI_CLIENT_ID')!,
      clientSecret: configService.get<string>('KWAI_CLIENT_SECRET')!,
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
