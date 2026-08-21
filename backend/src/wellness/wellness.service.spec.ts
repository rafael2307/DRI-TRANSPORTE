import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { NotFoundException } from '@nestjs/common';
import { WellnessService } from './wellness.service';
import { ConductorProfile } from '../users/entities/conductor-profile.entity';
import { WellnessCheckIn } from './entities/wellness-check-in.entity';
import { AiService } from '../ai/ai.service';

describe('WellnessService', () => {
  let service: WellnessService;
  let profileRepo: any;
  let checkInRepo: any;
  let redis: any;
  let aiService: any;

         beforeEach(async () => {
           profileRepo = {
             findOne: jest.fn(),
             save: jest.fn((p) => Promise.resolve(p)),
           };
           checkInRepo = {
             create: jest.fn((data) => ({ id: 'check-in-1', ...data })),
             save: jest.fn((c) => Promise.resolve(c)),
             findOne: jest.fn(),
           };
           redis = {
             get: jest.fn(),
             set: jest.fn(),
           };
           aiService = {
             getWellnessCheckInPrompt: jest
             .fn()
             .mockResolvedValue('¿Cómo vas? ¿Necesitas una pausa?'),
             assessWellnessResponse: jest
             .fn()
             .mockResolvedValue({ flagged: false }),
           };

                    const module: TestingModule = await Test.createTestingModule({
                      providers: [
                        WellnessService,
                        { provide: getRepositoryToken(ConductorProfile), useValue: profileRepo },
                        { provide: getRepositoryToken(WellnessCheckIn), useValue: checkInRepo },
                        { provide: getRedisConnectionToken(), useValue: redis },
                        { provide: AiService, useValue: aiService },
                        ],
                    }).compile();

                    service = module.get<WellnessService>(WellnessService);
         });

         it('should be defined', () => {
           expect(service).toBeDefined();
         });

         describe('setConsent', () => {
           it('activa el consentimiento y guarda la fecha', async () => {
             profileRepo.findOne.mockResolvedValue({
               wellnessCheckInsEnabled: false,
               wellnessConsentAt: null,
             });

              const result = await service.setConsent('driver-1', true);

              expect(result.enabled).toBe(true);
             expect(result.consentedAt).toBeInstanceOf(Date);
             expect(profileRepo.save).toHaveBeenCalled();
           });

                  it('al desactivar el consentimiento borra la fecha', async () => {
                    profileRepo.findOne.mockResolvedValue({
                      wellnessCheckInsEnabled: true,
                      wellnessConsentAt: new Date(),
                    });

                     const result = await service.setConsent('driver-1', false);

                     expect(result.enabled).toBe(false);
                    expect(result.consentedAt).toBeNull();
                  });

                  it('lanza NotFoundException si el conductor no tiene perfil', async () => {
                    profileRepo.findOne.mockResolvedValue(null);

                     await expect(service.setConsent('driver-1', true)).rejects.toThrow(
                       NotFoundException,
                       );
                  });
         });

         describe('maybeTriggerCheckIn', () => {
           it('no hace nada si el conductor no dio consentimiento', async () => {
             profileRepo.findOne.mockResolvedValue({
               wellnessCheckInsEnabled: false,
             });

              const result = await service.maybeTriggerCheckIn('driver-1');

              expect(result).toBeNull();
             expect(checkInRepo.save).not.toHaveBeenCalled();
           });

                  it('crea un chequeo si dio consentimiento y nunca hubo uno antes', async () => {
                    profileRepo.findOne.mockResolvedValue({
                      wellnessCheckInsEnabled: true,
                    });
                    redis.get.mockResolvedValue(null);

                     const result = await service.maybeTriggerCheckIn('driver-1');

                     expect(result).not.toBeNull();
                    expect(result?.message).toBe('¿Cómo vas? ¿Necesitas una pausa?');
                    expect(checkInRepo.save).toHaveBeenCalled();
                    expect(redis.set).toHaveBeenCalled();
                  });

                  it('no crea un chequeo si el ultimo fue hace poco', async () => {
                    profileRepo.findOne.mockResolvedValue({
                      wellnessCheckInsEnabled: true,
                    });
                    redis.get.mockResolvedValue(String(Date.now()));

                     const result = await service.maybeTriggerCheckIn('driver-1');

                     expect(result).toBeNull();
                    expect(checkInRepo.save).not.toHaveBeenCalled();
                  });
         });

         describe('recordResponse', () => {
           it('guarda la respuesta y el resultado de la evaluacion de la IA', async () => {
             checkInRepo.findOne.mockResolvedValue({
               id: 'check-in-1',
               response: null,
               flagged: false,
             });
             aiService.assessWellnessResponse.mockResolvedValue({ flagged: true });

              const result = await service.recordResponse(
                'check-in-1',
                'la verdad estoy muy cansado',
                );

              expect(result.response).toBe('la verdad estoy muy cansado');
             expect(result.flagged).toBe(true);
             expect(result.respondedAt).toBeInstanceOf(Date);
           });

                  it('lanza NotFoundException si el chequeo no existe', async () => {
                    checkInRepo.findOne.mockResolvedValue(null);

                     await expect(
                       service.recordResponse('check-in-1', 'todo bien'),
                       ).rejects.toThrow(NotFoundException);
                  });
         });
});
