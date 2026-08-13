import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConductorProfile } from './entities/conductor-profile.entity';
import { User } from './entities/user.entity';

@Controller('conductor')
export class ConductorController {
  constructor(
    @InjectRepository(ConductorProfile)
    private profileRepo: Repository<ConductorProfile>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Post('profile')
  async updateProfile(@Body() data: any) {
    // En una implementación real usaríamos @UseGuards(JwtAuthGuard)
    // para obtener el userId del token. Por ahora recibimos userId en el body
    const { userId, docs } = data;

    let profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      profile = this.profileRepo.create({ user });
    }

    profile.vehicleFrontUrl = docs.vehicleFront;
    profile.vehicleBackUrl = docs.vehicleBack;
    profile.vehicleLeftUrl = docs.vehicleLeft;
    profile.vehicleRightUrl = docs.vehicleRight;
    profile.vehicleInteriorUrl = docs.vehicleInterior;
    profile.driverLicenseUrl = docs.license;
    profile.idCardUrl = docs.idCard;
    profile.profilePictureUrl = docs.profilePicture;

    return this.profileRepo.save(profile);
  }

  @Get('pending')
  async getPending() {
    return this.profileRepo.find({
      where: { isApproved: false } as any,
      relations: ['user'],
    });
  }

  @Patch('approve/:id')
  async approve(@Param('id') id: string) {
    return this.profileRepo.update(id, { isApproved: true } as any);
  }
}
