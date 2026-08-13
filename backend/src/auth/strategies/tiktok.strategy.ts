import { PassportStrategy } from '@nestjs/passport';
// @ts-ignore
const Strategy: any = class {
  name = 'tiktok';
  constructor(o: any, v: any) {}
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, UserRole } from '../auth.service';

@Injectable()
export class TiktokStrategy extends PassportStrategy(Strategy, 'tiktok') {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('TIKTOK_CLIENT_ID')!,
      clientSecret: configService.get<string>('TIKTOK_CLIENT_SECRET')!,
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
