import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AppController } from './app.controller';
import { ConductorController } from './users/conductor.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Role } from './users/entities/role.entity';
import { SocialAccount } from './users/entities/social-account.entity';
import { Trip } from './trips/entities/trip.entity';
import { Review } from './trips/entities/review.entity';
import { ConductorProfile } from './users/entities/conductor-profile.entity';
import { PaymentConfig } from './payments/entities/payment-config.entity';
import { BankAccount } from './payments/entities/bank-account.entity';
import { AuthModule } from './auth/auth.module';
import { LocationModule } from './location/location.module';
import { PaymentsModule } from './payments/payments.module';
import { TripsModule } from './trips/trips.module';
import { AiModule } from './ai/ai.module';
import { ReviewsModule } from './trips/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WellnessModule } from './wellness/wellness.module';
import { PassengerAssistantModule } from './passenger-assistant/passenger-assistant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ConductorProfile]),
    NotificationsModule,
    AiModule,
    ReviewsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    LocationModule,
    PaymentsModule,
    TripsModule,
    WellnessModule,
    PassengerAssistantModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Railway (y otros PaaS) exponen una REDIS_URL lista para usar,
      // incluyendo password si aplica. En desarrollo local usamos
      // REDIS_HOST/REDIS_PORT sueltos desde .env.
      const url =
        configService.get<string>('REDIS_URL') ||
        `redis://${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)}`;
        return { type: 'single', url };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Idem: Railway expone DATABASE_URL para el Postgres administrado.
      // En local seguimos usando las variables sueltas del .env.
      const databaseUrl = configService.get<string>('DATABASE_URL');
        const base = databaseUrl
        ? { url: databaseUrl }
          : {
            host: configService.get<string>('DB_HOST'),
            port: configService.get<number>('DB_PORT'),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_DATABASE'),
          };
        return {
          type: 'postgres',
          ...base,
          autoLoadEntities: true,
          synchronize: true, // Only for development!
        };
      },
      inject: [ConfigService],
    }),
    ],
  controllers: [AppController, ConductorController],
  providers: [AppService],
})
  export class AppModule {}
