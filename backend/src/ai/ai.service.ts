import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async extractTripDetails(text: string) {
    // This is where Gemini integration would go.
    // For now, we simulate extraction logic.
    const textLower = text.toLowerCase();

    let serviceType = 'URBAN';
    let destination = 'Centro';
    let price = 8500;

    if (textLower.includes('intermunicipal') || textLower.includes('fuera')) {
      serviceType = 'INTERMUNICIPAL';
      destination = 'Girardot'; // Default mock target
      price = 25000;
    }

    if (textLower.includes('aeropuerto')) {
      destination = 'Aeropuerto';
      price = 15000;
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
    return {
      answer: `Basado en tu consulta "${query}", te recomiendo revisar la sección de pagos en el panel administrativo. Si el problema persiste, contacta a soporte técnico.`,
    };
  }

  async translateMessage(text: string) {
    // Simulated translation: if English detected (or just for demo)
    // Actually, we'll just append a "Translated" tag for the demo
    return `[AI Translated] ${text}`;
  }
}
