import {
  Injectable,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { SocialAccount } from '../users/entities/social-account.entity';
import { Logger } from '@nestjs/common';

export enum UserRole {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export class RegisterDto {
  email?: string;
  phone?: string;
  password?: string; // Required for email/phone register
  name: string;
  role?: UserRole;
  provider?: string; // For social login/register
  providerId?: string; // For social login/register
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(SocialAccount)
    private socialAccountsRepository: Repository<SocialAccount>,
    private jwtService: JwtService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async register(registrationData: RegisterDto) {
    const { email, password, name, phone, role, provider, providerId } =
      registrationData;

    // Validation for non-social registration
    if (!provider) {
      if (!email && !phone) {
        throw new ConflictException('Email or phone is required');
      }
      if (!password) {
        throw new ConflictException('Password is required');
      }
    }

    // Check if user already exists
    const query: any = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });

    const existingUser = await this.usersRepository.findOne({
      where: query,
    });

    if (existingUser && !provider) {
      throw new ConflictException(
        'User with this email or phone already exists',
      );
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // Get or create role
    const roleName = role || UserRole.PASSENGER;
    let userRole = await this.rolesRepository.findOne({
      where: { name: roleName },
    });

    if (!userRole) {
      userRole = this.rolesRepository.create({ name: roleName });
      await this.rolesRepository.save(userRole);
    }

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: userRole,
    });

    try {
      await this.usersRepository.save(user);

      const tokens = await this.getTokens(
        user.id,
        user.email || user.phone,
        userRole.name,
      );
      await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

      return {
        ...tokens,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: userRole.name,
        },
      };
    } catch (error) {
      this.logger.error(
        'Error creating user',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async socialLogin(socialData: {
    provider: string;
    providerId: string;
    email?: string;
    name: string;
    role?: UserRole;
  }) {
    const { provider, providerId, email, name, role } = socialData;

    // 1. Check if social account already exists
    let socialAccount = await this.socialAccountsRepository.findOne({
      where: { provider, providerId },
      relations: ['user', 'user.role'],
    });

    let user = socialAccount?.user;

    if (!user) {
      // 2. If not, check if user exists by email
      if (email) {
        user =
          (await this.usersRepository.findOne({
            where: { email },
            relations: ['role'],
          })) ?? undefined;
      }

      // 3. Get or create role
      const roleName = role || UserRole.PASSENGER;
      let userRole = await this.rolesRepository.findOne({
        where: { name: roleName },
      });
      if (!userRole) {
        userRole = this.rolesRepository.create({ name: roleName });
        await this.rolesRepository.save(userRole);
      }

      // 4. Create user if still not found
      if (!user) {
        user = this.usersRepository.create({
          email,
          name,
          role: userRole,
          phone: '',
        });
        await this.usersRepository.save(user);
      }

      // 5. Create social account link
      socialAccount = this.socialAccountsRepository.create({
        provider,
        providerId,
        user,
      });
      await this.socialAccountsRepository.save(socialAccount);
    }

    const tokens = await this.getTokens(
      user.id,
      user.email || user.phone,
      user.role.name,
    );
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    };
  }

  async sendOtp(phone: string, role: UserRole) {
    this.logger.log(`Sending OTP to ${phone} for role ${role}`);
    // Mock OTP sending logic
    return {
      success: true,
      message: 'OTP sent successfully (Simulado: 123456)',
    };
  }

  async verifyOtp(phone: string, code: string, role: UserRole) {
    this.logger.log(`Verifying OTP ${code} for ${phone}`);

    if (code !== '123456') {
      throw new ConflictException('Invalid OTP code');
    }

    // Find or create user
    let user = await this.usersRepository.findOne({
      where: { phone },
      relations: ['role'],
    });

    if (!user) {
      const roleName = role || UserRole.PASSENGER;
      let userRole = await this.rolesRepository.findOne({
        where: { name: roleName },
      });

      if (!userRole) {
        userRole = this.rolesRepository.create({ name: roleName });
        await this.rolesRepository.save(userRole);
      }

      user = this.usersRepository.create({
        phone,
        name: `User ${phone.slice(-4)}`,
        role: userRole,
      });
      await this.usersRepository.save(user);
    }

    const tokens = await this.getTokens(user.id, user.phone, user.role.name);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role.name,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(
      user.id,
      user.email || user.phone,
      user.role.name,
    );
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    await this.usersRepository.update(userId, { fcmToken });
    return { success: true };
  }

  async getTokens(userId: string, username: string, role: string) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, username, role },
        { expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, username, role },
        { expiresIn: '7d' },
      ),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      hashedRefreshToken: hash,
    });
  }
}
