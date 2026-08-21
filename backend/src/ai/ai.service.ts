import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Precios base por tipo de servicio. Esta es una regla de negocio: la tarifa
// siempre sale de esta tabla, Gemini solo se usa para interpretar el texto
// libre del usuario (detectar tipo de servicio y destino).
const BASE_PRICES: Record<string, number> = {
  URBAN: 8500,
  INTERMUNICIPAL: 25000,
  AIRPORT: 15000,
};

@Injectable()
  export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null;

constructor(private readonly configService: ConfigService) {
  const apiKey = this.configService.get<string>('GEMINI_API_KEY');
  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } else {
    this.model = null;
    this.logger.warn(
      'GEMINI_API_KEY no configurada: AiService funciona en modo simulado, sin llamadas reales a Gemini.',
      );
  }
}

async extractTripDetails(text: string) {
  if (this.model) {
    try {
      return await this.extractTripDetailsWithGemini(text);
    } catch (error) {
      this.logger.error(
        `Fallo la extraccion con Gemini, se usa el modo simulado como respaldo: ${error}`,
        );
    }
  }
  return this.extractTripDetailsSimulated(text);
}

private async extractTripDetailsWithGemini(text: string) {
  const prompt = `Eres el asistente de una app de transporte de pasajeros en Colombia.
  Analiza el siguiente pedido de un pasajero y responde SOLO con un JSON valido
  (sin markdown, sin explicacion) con esta forma exacta:
  {"serviceType": "URBAN" | "INTERMUNICIPAL", "destination": "nombre del lugar o Centro si no se menciona uno", "isAirport": true | false}

  Pedido del pasajero: "${text}"`;

  const result = await this.model!.generateContent(prompt);
  const raw = result.response.text().trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Respuesta de Gemini sin JSON reconocible: ${raw}`);
  }
  const parsed = JSON.parse(jsonMatch[0]);

  const serviceType = parsed.serviceType === 'INTERMUNICIPAL' ? 'INTERMUNICIPAL' : 'URBAN';
  const destination = parsed.destination || 'Centro';
  const price = parsed.isAirport ? BASE_PRICES.AIRPORT : BASE_PRICES[serviceType];

  return {
    success: true,
    data: { serviceType, destination, price, rawText: text },
  };
}

private extractTripDetailsSimulated(text: string) {
  const textLower = text.toLowerCase();

  let serviceType = 'URBAN';
  let destination = 'Centro';
  let price = BASE_PRICES.URBAN;

  if (textLower.includes('intermunicipal') || textLower.includes('fuera')) {
    serviceType = 'INTERMUNICIPAL';
    destination = 'Girardot';
    price = BASE_PRICES.INTERMUNICIPAL;
  }

  if (textLower.includes('aeropuerto')) {
    destination = 'Aeropuerto';
    price = BASE_PRICES.AIRPORT;
  }

  return {
    success: true,
    data: {
      serviceType,
      destination,
      price,
      rawText: text,
    },
  };
}

async getConductorSupport(query: string) {
  if (this.model) {
    try {
      const prompt = `Eres el asistente de soporte para conductores de una app de transporte de pasajeros en Colombia, similar a Uber o Didi. Responde de forma breve, clara y amable en espanol a esta consulta del conductor: "${query}"`;
      const result = await this.model.generateContent(prompt);
      return { answer: result.response.text().trim() };
    } catch (error) {
      this.logger.error(
        `Fallo la consulta a Gemini, se usa la respuesta simulada como respaldo: ${error}`,
        );
    }
  }
  return {
    answer: `Basado en tu consulta "${query}", te recomiendo revisar la seccion de pagos en el panel administrativo. Si el problema persiste, contacta a soporte tecnico.`,
  };
}

async translateMessage(text: string) {
  if (this.model) {
    try {
      const prompt = `Traduce el siguiente mensaje al ingles. Responde solo con la traduccion, sin explicaciones ni comillas: ${text}`;
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      this.logger.error(
        `Fallo la traduccion con Gemini, se usa el modo simulado como respaldo: ${error}`,
        );
    }
  }
  return `[AI Translated] ${text}`;
}

// Genera el mensaje corto y calido que el asistente le manda al conductor
// para un chequeo de bienestar/fatiga durante un viaje. El "reason" (por
// ahora solo SCHEDULED) queda como parametro para cuando se agreguen mas
// disparadores basados en patron de manejo.
async getWellnessCheckInPrompt(reason: string): Promise<string> {
  if (this.model) {
    try {
      const prompt = `Eres el asistente de bienestar para conductores de una app de transporte de pasajeros en Colombia. Genera un mensaje corto, calido y nada alarmante para chequear como esta el conductor durante un viaje activo (por ejemplo, preguntar si necesita una pausa). No suenes como un formulario ni uses la palabra "${reason}". Responde solo con el mensaje, sin comillas ni explicaciones.`;
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      this.logger.error(
        `Fallo al generar el chequeo de bienestar con Gemini, se usa el mensaje simulado como respaldo: ${error}`,
        );
    }
  }
  return this.getWellnessCheckInPromptSimulated();
}

private getWellnessCheckInPromptSimulated(): string {
  const options = [
    'Hola, como vas con el viaje? Si necesitas parar un momento a descansar, dimelo y te ayudo a coordinarlo.',
    'Solo pasaba a saludar: como te sientes? Si estas cansado, una pausa corta no le hace mal a nadie.',
    'Chequeo rapido: todo bien por alla? Si necesitas algo, aqui estoy.',
    ];
  return options[Math.floor(Math.random() * options.length)];
}

// Evalua (sin diagnosticar nada medico) si la respuesta del conductor a un
// chequeo de bienestar sugiere que podria necesitar una pausa o ayuda. El
// resultado solo se usa para dejarlo marcado en el registro auditable, no
// dispara ninguna accion automatica.
async assessWellnessResponse(response: string): Promise<{ flagged: boolean }> {
  if (this.model) {
    try {
      const prompt = `Un conductor de una app de transporte respondio esto a un chequeo de bienestar durante un viaje: "${response}". Responde SOLO con la palabra SI si el texto sugiere que el conductor esta cansado, no se siente bien, o necesita ayuda o una pausa. Responde SOLO con la palabra NO en cualquier otro caso.`;
      const result = await this.model.generateContent(prompt);
      const raw = result.response.text().trim().toUpperCase();
      return { flagged: raw.startsWith('SI') };
    } catch (error) {
      this.logger.error(
        `Fallo al evaluar la respuesta de bienestar con Gemini, se usa el modo simulado como respaldo: ${error}`,
        );
    }
  }
  return this.assessWellnessResponseSimulated(response);
}

private assessWellnessResponseSimulated(response: string): { flagged: boolean } {
  const textLower = response.toLowerCase();
  const concerningWords = [
    'cansad',
    'mal',
    'ayuda',
    'no puedo',
    'mareo',
    'dormid',
    'agotad',
    'sueno',
    ];
  const flagged = concerningWords.some((word) => textLower.includes(word));
  return { flagged };
}
}
