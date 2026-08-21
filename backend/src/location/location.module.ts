import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocationService } from './location.service';
import { LocationGateway } from './location.gateway';
import { TripsModule } from '../trips/trips.module';
import { AiModule } from '../ai/ai.module';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { WellnessModule } from '../wellness/wellness.module';

@Module({
  imports: [
    forwardRef(() => TripsModule),
    AiModule,
    WellnessModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') as any,
        },
      }),
      inject: [ConfigService],
    }),
    ],
  providers: [LocationService, LocationGateway, WsJwtGuard],
  exports: [LocationService],
})
  export class LocationModule {}
