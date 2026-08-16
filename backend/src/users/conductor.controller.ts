import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConductorProfile } from './entities/conductor-profile.entity';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('conductor')
export class ConductorController {
  constructor(
    @InjectRepository(ConductorProfile)
    private profileRepo: Repository<ConductorProfile>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async updateProfile(
    @CurrentUser() currentUser: JwtUser,
    @Body() data: any,
  ) {
    const userId = currentUser.sub;
    const { docs } = data;

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

  // TODO: reemplazar por un RolesGuard('admin') real cuando exista control de
  // roles en el backend. Por ahora solo exige estar autenticado.
  @UseGuards(JwtAuthGuard)
  @Get('pending')
  async getPending() {
    return this.profileRepo.find({
      where: { isApproved: false } as any,
      relations: ['user'],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('approve/:id')
  async approve(@Param('id') id: string) {
    return this.profileRepo.update(id, { isApproved: true } as any);
  }
}
