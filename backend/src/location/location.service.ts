import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly DRIVERS_KEY_PREFIX = 'drivers:locations';

  private readonly SOCKETS_KEY = 'users:sockets';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async registerSocket(userId: string, socketId: string) {
    await this.redis.hset(this.SOCKETS_KEY, userId, socketId);
  }

  async getSocketByUserId(userId: string): Promise<string | null> {
    return this.redis.hget(this.SOCKETS_KEY, userId);
  }

  async removeSocket(userId: string) {
    await this.redis.hdel(this.SOCKETS_KEY, userId);
  }

  async updateDriverLocation(
    driverId: string,
    lat: number,
    lng: number,
    serviceType: string = 'URBAN',
  ) {
    const key = `${this.DRIVERS_KEY_PREFIX}:${serviceType}`;
    this.logger.debug(
      `Updating location for driver ${driverId} (Type: ${serviceType}): ${lat}, ${lng}`,
    );
    await this.redis.geoadd(key, lng, lat, driverId);
    await this.redis.expire(key, 300);
  }

  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number = 5,
    serviceType: string = 'URBAN',
  ) {
    const key = `${this.DRIVERS_KEY_PREFIX}:${serviceType}`;
    return this.redis.georadius(
      key,
      lng,
      lat,
      radiusKm,
      'km',
      'WITHDIST',
      'WITHCOORD',
    );
  }

  async removeDriver(driverId: string, serviceType: string = 'URBAN') {
    const key = `${this.DRIVERS_KEY_PREFIX}:${serviceType}`;
    await this.redis.zrem(key, driverId);
  }
}
