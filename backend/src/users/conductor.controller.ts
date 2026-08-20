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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';
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

  // Solo administradores pueden ver conductores pendientes de aprobar.
  @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('pending')
    async getPending() {
          return this.profileRepo.find({
                  where: { isApproved: false } as any,
                  relations: ['user'],
          });
    }

  // Solo administradores pueden aprobar conductores.
  @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch('approve/:id')
    async approve(@Param('id') id: string) {
          return this.profileRepo.update(id, { isApproved: true } as any);
    }
}
