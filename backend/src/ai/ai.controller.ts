import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract-destination')
  async extractDestination(@Body() body: { text: string }) {
    return this.aiService.extractTripDetails(body.text);
  }

  @Post('query-support')
  async querySupport(@Body() body: { query: string }) {
    return this.aiService.getConductorSupport(body.query);
  }
}
