import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BankProvider } from './entities/bank-account.entity';
import { User } from '../users/entities/user.entity';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('price/:routeName')
  async getPrice(@Param('routeName') routeName: string) {
    return this.paymentsService.getRoutePrice(routeName);
  }

  @Post('bank-accounts')
  async registerBankAccount(
    @Body()
    data: {
      userId: string;
      provider: BankProvider;
      account: string;
      name: string;
      doc: string;
    },
  ) {
    // In a real app, we'd get user from @Req() req.user
    const mockUser = { id: data.userId } as User;
    return this.paymentsService.registerBankAccount(mockUser, data);
  }

  @Get('bank-accounts/:userId')
  async getBankAccounts(@Param('userId') userId: string) {
    const mockUser = { id: userId } as User;
    return this.paymentsService.getUserBankAccounts(mockUser);
  }

  @Patch('config/free-status')
  async toggleFreeStatus(@Body() data: { configId: number; isFree: boolean }) {
    return this.paymentsService.toggleRouteFreeStatus(
      data.configId,
      data.isFree,
    );
  }

  @Post('withdrawals')
  async requestWithdrawal(
    @Body() data: { userId: string; bankAccountId: string; amount: number },
  ) {
    const mockUser = { id: data.userId } as User;
    return this.paymentsService.requestWithdrawal(mockUser, data);
  }

  @Post('checkout')
  async createCheckout(
    @Body() data: { userId: string; amount: number; tripId?: string },
  ) {
    return this.paymentsService.createCheckoutSession(
      data.userId,
      data.amount,
      data.tripId,
    );
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook(payload);
  }

  @Get('withdrawals/all')
  async getAllWithdrawals() {
    return this.paymentsService.getAllWithdrawals();
  }

  @Get('withdrawals/:userId')
  async getWithdrawals(@Param('userId') userId: string) {
    return this.paymentsService.getWithdrawals(userId);
  }
}
