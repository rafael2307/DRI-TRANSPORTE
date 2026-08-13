import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const serviceAccountPath = path.join(
        process.cwd(),
        'secrets',
        'serviceAccountKey.json',
      );

      // Only initialize if not already initialized
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      }
    } catch (error) {
      this.logger.warn(
        'Firebase Admin SDK could not be initialized. Check if secrets/serviceAccountKey.json exists.',
      );
      this.logger.debug(error);
    }
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: any,
  ) {
    if (!token) return;

    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      token,
      data: data || {},
    };

    try {
      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent message: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error.message}`);
      throw error;
    }
  }
}
