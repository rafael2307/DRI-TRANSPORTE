import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BankProvider } from './entities/bank-account.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Público: solo devuelve el precio de una ruta, no datos de usuario.
  @Get('price/:routeName')
  async getPrice(@Param('routeName') routeName: string) {
    return this.paymentsService.getRoutePrice(routeName);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bank-accounts')
  async registerBankAccount(
    @CurrentUser() currentUser: JwtUser,
    @Body()
    data: {
      provider: BankProvider;
      account: string;
      name: string;
      doc: string;
    },
  ) {
    const user = { id: currentUser.sub } as User;
    return this.paymentsService.registerBankAccount(user, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bank-accounts/me')
  async getBankAccounts(@CurrentUser() currentUser: JwtUser) {
    const user = { id: currentUser.sub } as User;
    return this.paymentsService.getUserBankAccounts(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('balance/me')
  async getBalance(@CurrentUser() currentUser: JwtUser) {
    return this.paymentsService.getDriverBalance(currentUser.sub);
  }

  // TODO: reemplazar por un RolesGuard('admin') real cuando exista control de
  // roles en el backend. Por ahora solo exige estar autenticado.
  @UseGuards(JwtAuthGuard)
  @Patch('config/free-status')
  async toggleFreeStatus(@Body() data: { configId: number; isFree: boolean }) {
    return this.paymentsService.toggleRouteFreeStatus(
      data.configId,
      data.isFree,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('withdrawals')
  async requestWithdrawal(
    @CurrentUser() currentUser: JwtUser,
    @Body() data: { bankAccountId: string; amount: number },
  ) {
    const user = { id: currentUser.sub } as User;
    return this.paymentsService.requestWithdrawal(user, data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(
    @CurrentUser() currentUser: JwtUser,
    @Body() data: { amount: number; tripId?: string },
  ) {
    return this.paymentsService.createCheckoutSession(
      currentUser.sub,
      data.amount,
      data.tripId,
    );
  }

  // Público: Wompi llama este endpoint directamente y no puede enviar
  // nuestro JWT. La confianza viene de verificar la firma del payload
  // (ver PaymentsService.verifyWebhookSignature), no de un guard.
  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions/:reference')
  async getTransaction(
    @CurrentUser() currentUser: JwtUser,
    @Param('reference') reference: string,
  ) {
    return this.paymentsService.getTransactionByReference(
      reference,
      currentUser.sub,
    );
  }

  // TODO: reemplazar por un RolesGuard('admin') real cuando exista control de
  // roles en el backend. Por ahora solo exige estar autenticado.
  @UseGuards(JwtAuthGuard)
  @Get('withdrawals/all')
  async getAllWithdrawals() {
    return this.paymentsService.getAllWithdrawals();
  }

  @UseGuards(JwtAuthGuard)
  @Get('withdrawals/me')
  async getWithdrawals(@CurrentUser() currentUser: JwtUser) {
    return this.paymentsService.getWithdrawals(currentUser.sub);
  }
}
