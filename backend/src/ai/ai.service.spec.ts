import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

// Mock del SDK de Gemini: nunca queremos que los tests hagan una llamada de
// red real, y asi podemos controlar exactamente que responde el modelo.
const mockGenerateContent = jest.fn();
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe('AiService', () => {
  const buildService = async (apiKey?: string) => {
    const mockConfigService = {
      get: jest.fn((key: string) =>
        key === 'GEMINI_API_KEY' ? apiKey : undefined,
                   ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
        ],
    }).compile();

    return module.get<AiService>(AiService);
  };

         beforeEach(() => {
           mockGenerateContent.mockReset();
         });

         describe('sin GEMINI_API_KEY (modo simulado)', () => {
           let service: AiService;

                  beforeEach(async () => {
                    service = await buildService(undefined);
                  });

                  it('should be defined', () => {
                    expect(service).toBeDefined();
                  });

                  it('detecta un viaje urbano por defecto', async () => {
                    const result = await service.extractTripDetails('Quiero ir al centro');
                    expect(result.data.serviceType).toBe('URBAN');
                    expect(result.data.price).toBe(8500);
                  });

                  it('detecta un viaje intermunicipal', async () => {
                    const result = await service.extractTripDetails('Necesito un viaje intermunicipal a Girardot');
                    expect(result.data.serviceType).toBe('INTERMUNICIPAL');
                    expect(result.data.price).toBe(25000);
                  });

                  it('detecta un viaje al aeropuerto', async () => {
                    const result = await service.extractTripDetails('Voy para el aeropuerto');
                    expect(result.data.destination).toBe('Aeropuerto');
                    expect(result.data.price).toBe(15000);
                  });

                  it('no llama a Gemini en modo simulado', async () => {
                    await service.extractTripDetails('cualquier texto');
                    expect(mockGenerateContent).not.toHaveBeenCalled();
                  });

                  it('genera un mensaje de chequeo de bienestar simulado', async () => {
                    const message = await service.getWellnessCheckInPrompt('SCHEDULED');
                    expect(typeof message).toBe('string');
                    expect(message.length).toBeGreaterThan(0);
                    expect(mockGenerateContent).not.toHaveBeenCalled();
                  });

                  it('marca como preocupante una respuesta que menciona cansancio', async () => {
                    const result = await service.assessWellnessResponse('estoy muy cansado, necesito una pausa');
                    expect(result.flagged).toBe(true);
                  });

                  it('no marca como preocupante una respuesta normal', async () => {
                    const result = await service.assessWellnessResponse('todo bien, gracias');
                    expect(result.flagged).toBe(false);
                  });

                  it('responde en modo simulado al chat del pasajero', async () => {
                    const reply = await service.chatWithPassenger('hola, cuanto falta?');
                    expect(typeof reply).toBe('string');
                    expect(reply.length).toBeGreaterThan(0);
                    expect(mockGenerateContent).not.toHaveBeenCalled();
                  });

                  it('genera un resumen de viaje simulado', async () => {
                    const summary = await service.generateTripSummary({
                      pickupLocationName: 'Casa',
                      destinationName: 'Oficina',
                      fare: 8500,
                      serviceType: 'URBAN',
                    });
                    expect(summary).toContain('Casa');
                    expect(summary).toContain('Oficina');
                    expect(mockGenerateContent).not.toHaveBeenCalled();
                  });
         });

         describe('con GEMINI_API_KEY (modo real)', () => {
           let service: AiService;

                  beforeEach(async () => {
                    service = await buildService('fake-key-for-tests');
                  });

                  it('usa la respuesta de Gemini para extraer el destino', async () => {
                    mockGenerateContent.mockResolvedValue({
                      response: {
                        text: () => '{"serviceType": "URBAN", "destination": "Chapinero", "isAirport": false}',
                      },
                    });

                     const result = await service.extractTripDetails('Voy a Chapinero');

                     expect(mockGenerateContent).toHaveBeenCalled();
                    expect(result.data.destination).toBe('Chapinero');
                    expect(result.data.serviceType).toBe('URBAN');
                    expect(result.data.price).toBe(8500);
                  });

                  it('cae de vuelta al modo simulado si Gemini responde algo invalido', async () => {
                    mockGenerateContent.mockResolvedValue({
                      response: { text: () => 'esto no es JSON' },
                    });

                     const result = await service.extractTripDetails('Necesito un viaje intermunicipal');

                     expect(result.data.serviceType).toBe('INTERMUNICIPAL');
                  });

                  it('cae de vuelta al modo simulado si Gemini lanza un error', async () => {
                    mockGenerateContent.mockRejectedValue(new Error('network error'));

                     const result = await service.extractTripDetails('Voy al aeropuerto');

                     expect(result.data.destination).toBe('Aeropuerto');
                  });

                  it('usa Gemini para responder consultas de soporte al conductor', async () => {
                    mockGenerateContent.mockResolvedValue({
                      response: { text: () => 'Respuesta real de Gemini' },
                    });

                     const result = await service.getConductorSupport('Como retiro?');

                     expect(result.answer).toBe('Respuesta real de Gemini');
                  });

                  it('usa Gemini para traducir mensajes', async () => {
                    mockGenerateContent.mockResolvedValue({
                      response: { text: () => 'Hello driver' },
                    });

                     const result = await service.translateMessage('Hola conductor');

                     expect(result).toBe('Hello driver');
                  });

                  it('usa Gemini para generar el chequeo de bienestar', async () => {
                    mockGenerateContent.mockResolvedValue({
                      response: { text: () => 'Como vas? Todo bien por alla?' },
                    });

                     const message = await service.getWellnessCheckInPrompt('SCHEDULED');

                     expect(mockGenerateContent).toHaveBeenCalled();
                    expect(message).toBe('Como vas? Todo bien por alla?');
                  });

                  it('usa Gemini para evaluar si una respuesta es preocupante', async () => {
                    mockGenerateContent.mockResolvedValue({
                      response: { text: () => 'SI' },
                    });

                     const result = await service.assessWellnessResponse('no doy mas, estoy fatal');

                     expect(mockGenerateContent).toHaveBeenCalled();
                    expect(result.flagged).toBe(true);
                  });

                  it('cae al modo simulado si Gemini falla al evaluar la respuesta', async () => {
                    mockGenerateContent.mockRejectedValue(new Error('network error'));

                     const result = await service.assessWellnessResponse('todo excelente');

                     expect(result.flagged).toBe(false);
                  });

                  it('usa Gemini para el chat con el pasajero', async () => {
                    mockGenerateContent.mockResolvedValue({
                      response: { text: () => 'Ya casi llegamos, tranquilo!' },
                    });

                     const reply = await service.chatWithPassenger('falta mucho?');

                     expect(mockGenerateContent).toHaveBeenCalled();
                    expect(reply).toBe('Ya casi llegamos, tranquilo!');
                  });

                  it('cae al modo simulado si Gemini falla en el chat con el pasajero', async () => {
                    mockGenerateContent.mockRejectedValue(new Error('network error'));

                     const reply = await service.chatWithPassenger('hola');

                     expect(typeof reply).toBe('string');
                    expect(reply.length).toBeGreaterThan(0);
                  });

                  it('usa Gemini para generar el resumen del viaje', async () => {
                    mockGenerateContent.mockResolvedValue({
                      response: { text: () => 'Que viaje tan tranquilo, gracias por confiar en nosotros!' },
                    });

                     const summary = await service.generateTripSummary({
                       pickupLocationName: 'Casa',
                       destinationName: 'Oficina',
                       fare: 8500,
                       serviceType: 'URBAN',
                     });

                     expect(mockGenerateContent).toHaveBeenCalled();
                    expect(summary).toBe('Que viaje tan tranquilo, gracias por confiar en nosotros!');
                  });

                  it('cae al modo simulado si Gemini falla al generar el resumen del viaje', async () => {
                    mockGenerateContent.mockRejectedValue(new Error('network error'));

                     const summary = await service.generateTripSummary({
                       pickupLocationName: 'Casa',
                       destinationName: 'Oficina',
                       fare: 8500,
                       serviceType: 'URBAN',
                     });

                     expect(summary).toContain('Casa');
                  });
         });
});
