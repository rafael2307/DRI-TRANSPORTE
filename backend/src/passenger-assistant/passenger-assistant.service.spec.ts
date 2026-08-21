import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PassengerAssistantService } from './passenger-assistant.service';
import { User } from '../users/entities/user.entity';
import { SosAlert } from './entities/sos-alert.entity';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('PassengerAssistantService', () => {
  let service: PassengerAssistantService;
  let userRepo: any;
  let sosAlertRepo: any;
  let aiService: any;
  let notificationsService: any;

         beforeEach(async () => {
           userRepo = {
             findOne: jest.fn(),
             save: jest.fn((u) => Promise.resolve(u)),
           };
           sosAlertRepo = {
             create: jest.fn((data) => ({ id: 'sos-1', ...data })),
             save: jest.fn((a) => Promise.resolve(a)),
           };
           aiService = {
             chatWithPassenger: jest.fn().mockResolvedValue('Todo va bien por acá.'),
           };
           notificationsService = {
             sendPushNotification: jest.fn().mockResolvedValue('sent'),
           };

                    const module: TestingModule = await Test.createTestingModule({
                      providers: [
                        PassengerAssistantService,
                        { provide: getRepositoryToken(User), useValue: userRepo },
                        { provide: getRepositoryToken(SosAlert), useValue: sosAlertRepo },
                        { provide: AiService, useValue: aiService },
                        { provide: NotificationsService, useValue: notificationsService },
                        ],
                    }).compile();

                    service = module.get<PassengerAssistantService>(PassengerAssistantService);
         });

         it('should be defined', () => {
           expect(service).toBeDefined();
         });

         describe('getPreferences / setPreferences', () => {
           it('activa el asistente y guarda la fecha', async () => {
             userRepo.findOne.mockResolvedValue({
               assistantChatEnabled: false,
               assistantChatEnabledAt: null,
             });

              const result = await service.setPreferences('user-1', true);

              expect(result.enabled).toBe(true);
             expect(result.enabledAt).toBeInstanceOf(Date);
             expect(userRepo.save).toHaveBeenCalled();
           });

                  it('al desactivar borra la fecha', async () => {
                    userRepo.findOne.mockResolvedValue({
                      assistantChatEnabled: true,
                      assistantChatEnabledAt: new Date(),
                    });

                     const result = await service.setPreferences('user-1', false);

                     expect(result.enabled).toBe(false);
                    expect(result.enabledAt).toBeNull();
                  });

                  it('lanza NotFoundException si el usuario no existe', async () => {
                    userRepo.findOne.mockResolvedValue(null);

                     await expect(service.setPreferences('user-1', true)).rejects.toThrow(
                       NotFoundException,
                       );
                  });
         });

         describe('chat', () => {
           it('rechaza el chat si el pasajero no activó el asistente', async () => {
             userRepo.findOne.mockResolvedValue({ assistantChatEnabled: false });

              await expect(service.chat('user-1', 'hola')).rejects.toThrow(
                ForbiddenException,
                );
             expect(aiService.chatWithPassenger).not.toHaveBeenCalled();
           });

                  it('responde si el pasajero activó el asistente', async () => {
                    userRepo.findOne.mockResolvedValue({ assistantChatEnabled: true });

                     const result = await service.chat('user-1', 'hola');

                     expect(result.reply).toBe('Todo va bien por acá.');
                    expect(aiService.chatWithPassenger).toHaveBeenCalledWith('hola');
                  });
         });

         describe('triggerSos', () => {
           it('crea la alerta y notifica al conductor si tiene token FCM', async () => {
             const result = await service.triggerSos({
               tripId: 'trip-1',
               passengerId: 'passenger-1',
               driverFcmToken: 'fcm-token-abc',
               lat: 4.6,
               lng: -74.08,
             });

              expect(sosAlertRepo.save).toHaveBeenCalled();
             expect(notificationsService.sendPushNotification).toHaveBeenCalledWith(
               'fcm-token-abc',
               expect.any(String),
               expect.any(String),
               expect.objectContaining({ tripId: 'trip-1', type: 'SOS' }),
               );
             expect(result.driverNotified).toBe(true);
           });

                  it('crea la alerta igual aunque el conductor no tenga token FCM', async () => {
                    const result = await service.triggerSos({
                      tripId: 'trip-1',
                      passengerId: 'passenger-1',
                      lat: 4.6,
                      lng: -74.08,
                    });

                     expect(sosAlertRepo.save).toHaveBeenCalled();
                    expect(notificationsService.sendPushNotification).not.toHaveBeenCalled();
                    expect(result.driverNotified).toBe(false);
                  });

                  it('crea la alerta aunque falle el envío de la notificación', async () => {
                    notificationsService.sendPushNotification.mockRejectedValue(
                      new Error('fcm caído'),
                      );

                     const result = await service.triggerSos({
                       tripId: 'trip-1',
                       passengerId: 'passenger-1',
                       driverFcmToken: 'fcm-token-abc',
                       lat: 4.6,
                       lng: -74.08,
                     });

                     expect(sosAlertRepo.save).toHaveBeenCalled();
                    expect(result.driverNotified).toBe(false);
                  });
         });
});
