import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BankProvider } from './entities/bank-account.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

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

  // Solo administradores pueden cambiar si una ruta es gratuita.
  @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
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

  // Solo administradores pueden ver todos los retiros de todos los usuarios.
  @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
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
