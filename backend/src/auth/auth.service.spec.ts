import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, UserRole } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { SocialAccount } from '../users/entities/social-account.entity';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockRolesRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSocialAccountsRepository = {};

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: getRepositoryToken(Role), useValue: mockRolesRepository },
        {
          provide: getRepositoryToken(SocialAccount),
          useValue: mockSocialAccountsRepository,
        },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── register ────────────────────────────────────────────────────────────────
  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      mockUsersRepository.findOne.mockResolvedValue({ id: '1' });
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test',
          phone: '123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should return access_token and refresh_token on success', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockRolesRepository.findOne.mockResolvedValue({
        id: '1',
        name: UserRole.PASSENGER,
      });
      mockUsersRepository.create.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
      });
      mockUsersRepository.save.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
      });
      mockUsersRepository.update.mockResolvedValue({});

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '123456789',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  // ─── refreshTokens ────────────────────────────────────────────────────────────
  describe('refreshTokens', () => {
    it('should throw ForbiddenException if user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      await expect(
        service.refreshTokens('user-id', 'some-token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if refresh token does not match', async () => {
      const hashedToken = await bcrypt.hash('correct-token', 10);
      mockUsersRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        hashedRefreshToken: hashedToken,
        role: { name: UserRole.PASSENGER },
      });
      await expect(
        service.refreshTokens('user-id', 'wrong-token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return new tokens if refresh token is valid', async () => {
      const validToken = 'valid-refresh-token';
      const hashedToken = await bcrypt.hash(validToken, 10);
      mockUsersRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        hashedRefreshToken: hashedToken,
        role: { name: UserRole.PASSENGER },
      });
      mockUsersRepository.update.mockResolvedValue({});

      const result = await service.refreshTokens('user-id', validToken);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });

  // ─── updateFcmToken ───────────────────────────────────────────────────────────
  describe('updateFcmToken', () => {
    it('should update the FCM token and return success', async () => {
      mockUsersRepository.update.mockResolvedValue({});
      const result = await service.updateFcmToken('user-id', 'fcm-token-123');
      expect(mockUsersRepository.update).toHaveBeenCalledWith('user-id', {
        fcmToken: 'fcm-token-123',
      });
      expect(result).toEqual({ success: true });
    });
  });
});
