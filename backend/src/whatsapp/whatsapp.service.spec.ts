import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import {
  WhatsAppSession,
  WhatsAppSessionState,
} from './entities/whatsapp-session.entity';
import { User } from '../users/entities/user.entity';
import { AiService } from '../ai/ai.service';
import { TripsService } from '../trips/trips.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let sessionRepo: any;
  let userRepo: any;
  let aiService: any;
  let tripsService: any;
  let configService: any;

         const buildModule = async (config: Record<string, string | undefined> = {}) => {
           sessionRepo = {
             findOne: jest.fn(),
             create: jest.fn((data) => ({ id: 'session-1', ...data })),
             save: jest.fn((s) => Promise.resolve(s)),
           };
           userRepo = {
             findOne: jest.fn(),
           };
           aiService = {
             extractTripDetails: jest.fn(),
           };
           tripsService = {
             requestTrip: jest.fn(),
           };
           configService = {
             get: jest.fn((key: string) => config[key]),
           };

           const module: TestingModule = await Test.createTestingModule({
             providers: [
               WhatsAppService,
               { provide: getRepositoryToken(WhatsAppSession), useValue: sessionRepo },
               { provide: getRepositoryToken(User), useValue: userRepo },
               { provide: ConfigService, useValue: configService },
               { provide: AiService, useValue: aiService },
               { provide: TripsService, useValue: tripsService },
               ],
           }).compile();

           service = module.get<WhatsAppService>(WhatsAppService);
         };

         beforeEach(async () => {
           await buildModule();
         });

         it('should be defined', () => {
           expect(service).toBeDefined();
         });

         describe('modo simulado (sin credenciales)', () => {
           it('isRealModeConfigured es false sin token ni phoneNumberId', () => {
             expect(service.isRealModeConfigured).toBe(false);
           });

                  it('sendTextMessage no llama a fetch en modo simulado', async () => {
                    const fetchSpy = jest.spyOn(global, 'fetch' as any);
                    await service.sendTextMessage('+573001234567', 'hola');
                    expect(fetchSpy).not.toHaveBeenCalled();
                    fetchSpy.mockRestore();
                  });
         });

         describe('modo real (con credenciales)', () => {
           beforeEach(async () => {
             await buildModule({
               WHATSAPP_TOKEN: 'token-real',
               WHATSAPP_PHONE_NUMBER_ID: 'phone-id-real',
             });
           });

                  it('isRealModeConfigured es true con token y phoneNumberId', () => {
                    expect(service.isRealModeConfigured).toBe(true);
                  });

                  it('sendTextMessage llama a la API real de Meta', async () => {
                    const fetchMock = jest
                    .fn()
                    .mockResolvedValue({ ok: true, text: async () => '' });
                    (global as any).fetch = fetchMock;

                     await service.sendTextMessage('+573001234567', 'hola');

                     expect(fetchMock).toHaveBeenCalledWith(
                       expect.stringContaining('phone-id-real'),
                       expect.objectContaining({ method: 'POST' }),
                       );
                  });

                  it('no lanza si la API real falla, solo lo registra', async () => {
                    (global as any).fetch = jest
                    .fn()
                    .mockResolvedValue({ ok: false, status: 500, text: async () => 'error' });

                     await expect(
                       service.sendTextMessage('+573001234567', 'hola'),
                       ).resolves.not.toThrow();
                  });
         });

         describe('verifyWebhookChallenge', () => {
           it('falla si no hay WHATSAPP_VERIFY_TOKEN configurado', () => {
             expect(service.verifyWebhookChallenge('subscribe', 'lo que sea')).toEqual({
               ok: false,
             });
           });

                  it('acepta cuando el modo y el token coinciden', async () => {
                    await buildModule({ WHATSAPP_VERIFY_TOKEN: 'secreto-123' });
                    expect(service.verifyWebhookChallenge('subscribe', 'secreto-123')).toEqual({
                      ok: true,
                    });
                  });

                  it('rechaza si el token no coincide', async () => {
                    await buildModule({ WHATSAPP_VERIFY_TOKEN: 'secreto-123' });
                    expect(service.verifyWebhookChallenge('subscribe', 'otro-token')).toEqual({
                      ok: false,
                    });
                  });
         });


         describe('processIncomingMessage — flujo completo de pedido de viaje', () => {
           const passengerUser = {
             id: 'user-1',
             phone: '+573001234567',
             role: { name: 'passenger' },
           };

                  it('pide registrarse en la app si el número no tiene cuenta de pasajero', async () => {
                    sessionRepo.findOne.mockResolvedValue(null);
                    userRepo.findOne.mockResolvedValue(null);
                    const sendSpy = jest.spyOn(service, 'sendTextMessage').mockResolvedValue();

                     await service.processIncomingMessage({
                       from: '+573009999999',
                       type: 'text',
                       text: { body: 'hola' },
                     });

                     expect(sendSpy).toHaveBeenCalledWith(
                       '+573009999999',
                       expect.stringContaining('No encontramos una cuenta'),
                       );
                  });

                  it('arranca el flujo pidiendo ubicación cuando la sesión está IDLE', async () => {
                    sessionRepo.findOne.mockResolvedValue(null);
                    userRepo.findOne.mockResolvedValue(passengerUser);
                    const sendSpy = jest.spyOn(service, 'sendTextMessage').mockResolvedValue();

                     await service.processIncomingMessage({
                       from: passengerUser.phone,
                       type: 'text',
                       text: { body: 'quiero un viaje' },
                     });

                     expect(sendSpy).toHaveBeenCalledWith(
                       passengerUser.phone,
                       expect.stringContaining('compartí tu ubicación'),
                       );
                  });

                  it('guarda la ubicación y pide destino en estado AWAITING_LOCATION', async () => {
                    sessionRepo.findOne.mockResolvedValue({
                      id: 'session-1',
                      phone: passengerUser.phone,
                      user: passengerUser,
                      state: WhatsAppSessionState.AWAITING_LOCATION,
                    });
                    const sendSpy = jest.spyOn(service, 'sendTextMessage').mockResolvedValue();

                     await service.processIncomingMessage({
                       from: passengerUser.phone,
                       type: 'location',
                       location: { latitude: 4.65, longitude: -74.05 },
                     });

                     expect(sessionRepo.save).toHaveBeenCalledWith(
                       expect.objectContaining({
                         pickupLat: 4.65,
                         pickupLng: -74.05,
                         state: WhatsAppSessionState.AWAITING_DESTINATION,
                       }),
                       );
                    expect(sendSpy).toHaveBeenCalledWith(
                      passengerUser.phone,
                      expect.stringContaining('¿A dónde vas?'),
                      );
                  });

                  it('extrae el destino con AiService y pasa a CONFIRMING', async () => {
                    sessionRepo.findOne.mockResolvedValue({
                      id: 'session-1',
                      phone: passengerUser.phone,
                      user: passengerUser,
                      state: WhatsAppSessionState.AWAITING_DESTINATION,
                      pickupLat: 4.65,
                      pickupLng: -74.05,
                    });
                    aiService.extractTripDetails.mockResolvedValue({
                      success: true,
                      data: { serviceType: 'URBAN', destination: 'Centro', price: 8500 },
                    });
                    const sendSpy = jest.spyOn(service, 'sendTextMessage').mockResolvedValue();

                     await service.processIncomingMessage({
                       from: passengerUser.phone,
                       type: 'text',
                       text: { body: 'al centro' },
                     });

                     expect(aiService.extractTripDetails).toHaveBeenCalledWith('al centro');
                    expect(sessionRepo.save).toHaveBeenCalledWith(
                      expect.objectContaining({
                        destinationName: 'Centro',
                        state: WhatsAppSessionState.CONFIRMING,
                      }),
                      );
                    expect(sendSpy).toHaveBeenCalledWith(
                      passengerUser.phone,
                      expect.stringContaining('Respondé SI'),
                      );
                  });


                  it('crea el viaje al confirmar con SI', async () => {
                    sessionRepo.findOne.mockResolvedValue({
                      id: 'session-1',
                      phone: passengerUser.phone,
                      user: passengerUser,
                      state: WhatsAppSessionState.CONFIRMING,
                      pickupLat: 4.65,
                      pickupLng: -74.05,
                      pickupName: 'Ubicación compartida por WhatsApp',
                      destinationName: 'Centro',
                      serviceType: 'URBAN',
                      estimatedFare: 8500,
                    });
                    tripsService.requestTrip.mockResolvedValue({ id: 'trip-abc-123' });
                    const sendSpy = jest.spyOn(service, 'sendTextMessage').mockResolvedValue();

                     await service.processIncomingMessage({
                       from: passengerUser.phone,
                       type: 'text',
                       text: { body: 'si' },
                     });

                     expect(tripsService.requestTrip).toHaveBeenCalledWith(
                       expect.objectContaining({ id: passengerUser.id }),
                       expect.objectContaining({
                         pickupName: 'Ubicación compartida por WhatsApp',
                         destName: 'Centro',
                         serviceType: 'URBAN',
                       }),
                       );
                    expect(sendSpy).toHaveBeenCalledWith(
                      passengerUser.phone,
                      expect.stringContaining('fue solicitado'),
                      );
                  });

                  it('cancela y resetea la sesión al responder NO', async () => {
                    sessionRepo.findOne.mockResolvedValue({
                      id: 'session-1',
                      phone: passengerUser.phone,
                      user: passengerUser,
                      state: WhatsAppSessionState.CONFIRMING,
                    });
                    const sendSpy = jest.spyOn(service, 'sendTextMessage').mockResolvedValue();

                     await service.processIncomingMessage({
                       from: passengerUser.phone,
                       type: 'text',
                       text: { body: 'no' },
                     });

                     expect(tripsService.requestTrip).not.toHaveBeenCalled();
                    expect(sessionRepo.save).toHaveBeenCalledWith(
                      expect.objectContaining({ state: WhatsAppSessionState.IDLE }),
                      );
                    expect(sendSpy).toHaveBeenCalledWith(
                      passengerUser.phone,
                      expect.stringContaining('cancelado'),
                      );
                  });
         });
});
