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
}
