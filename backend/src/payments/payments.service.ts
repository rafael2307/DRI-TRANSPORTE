import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { PaymentConfig } from './entities/payment-config.entity';
import { BankAccount, BankProvider } from './entities/bank-account.entity';
import { Withdrawal, WithdrawalStatus } from './entities/withdrawal.entity';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Trip, TripStatus } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentConfig)
    private configRepo: Repository<PaymentConfig>,
    @InjectRepository(BankAccount)
    private bankRepo: Repository<BankAccount>,
    @InjectRepository(Withdrawal)
    private withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
    private configService: ConfigService,
  ) {}

  async getRoutePrice(
    routeName: string,
    serviceType: string = 'URBAN',
  ): Promise<{ price: number; isFree: boolean }> {
    const config = await this.configRepo.findOne({ where: { routeName } });

    const price =
      config && config.isEnabled
        ? Number(config.basePrice)
        : serviceType === 'URBAN'
          ? 5000
          : 25000;

    return {
      price: config && config.isFree ? 0 : price,
      isFree: (config && config.isFree) || false,
    };
  }

  async registerBankAccount(
    user: User,
    data: {
      provider: BankProvider;
      account: string;
      name: string;
      doc: string;
    },
  ) {
    const bankAccount = this.bankRepo.create({
      user,
      provider: data.provider,
      accountNumber: data.account,
      accountHolderName: data.name,
      documentNumber: data.doc,
    });
    return this.bankRepo.save(bankAccount);
  }

  async getUserBankAccounts(user: User) {
    return this.bankRepo.find({ where: { user: { id: user.id } } });
  }

  // Admin method to toggle free status
  async toggleRouteFreeStatus(id: number, isFree: boolean) {
    return this.configRepo.update(id, { isFree });
  }

  // Saldo disponible = fare de todos los viajes COMPLETED como conductor,
  // menos lo que ya retiró o tiene en retiros pendientes por aprobar.
  async getDriverBalance(userId: string) {
    const { total: totalEarnings } = await this.tripRepo
      .createQueryBuilder('trip')
      .select('COALESCE(SUM(trip.fare), 0)', 'total')
      .where('trip.driverId = :userId', { userId })
      .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
      .getRawOne();

    const { total: totalWithdrawn } = await this.withdrawalRepo
      .createQueryBuilder('withdrawal')
      .select('COALESCE(SUM(withdrawal.amount), 0)', 'total')
      .where('withdrawal.userId = :userId', { userId })
      .andWhere('withdrawal.status IN (:...statuses)', {
        statuses: [WithdrawalStatus.PENDING, WithdrawalStatus.COMPLETED],
      })
      .getRawOne();

    const earnings = Number(totalEarnings);
    const withdrawn = Number(totalWithdrawn);

    return {
      totalEarnings: earnings,
      totalWithdrawn: withdrawn,
      available: Math.max(0, earnings - withdrawn),
    };
  }

  async requestWithdrawal(
    user: User,
    data: { bankAccountId: string; amount: number },
  ) {
    if (!data.amount || data.amount <= 0) {
      throw new ConflictException('El monto a retirar debe ser mayor a 0');
    }

    const bankAccount = await this.bankRepo.findOne({
      where: { id: data.bankAccountId, user: { id: user.id } },
    });
    if (!bankAccount)
      throw new Error('Bank account not found or does not belong to user');

    const { available } = await this.getDriverBalance(user.id);
    if (data.amount > available) {
      throw new ConflictException(
        `Saldo insuficiente: disponible $${available.toLocaleString('es-CO')}`,
      );
    }

    const withdrawal = this.withdrawalRepo.create({
      user,
      bankAccount,
      amount: data.amount,
      status: WithdrawalStatus.PENDING,
    });

    return this.withdrawalRepo.save(withdrawal);
  }

  async getWithdrawals(userId: string) {
    return this.withdrawalRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllWithdrawals() {
    return this.withdrawalRepo.find({
      relations: ['user', 'bankAccount'],
      order: { createdAt: 'DESC' },
    });
  }

  // --- Wompi Integration ---

  async createCheckoutSession(userId: string, amount: number, tripId?: string) {
    const publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY');
    const integritySecret = this.configService.get<string>(
      'WOMPI_INTEGRITY_SECRET',
    );
    if (!publicKey || !integritySecret) {
      throw new Error(
        'Wompi no está configurado: define WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_SECRET en el .env',
      );
    }

    const redirectUrl = this.configService.get<string>(
      'WOMPI_REDIRECT_URL',
      'dripasajero://payment-result',
    );

    const reference = `TRX_${Date.now()}_${userId.slice(0, 4)}`;
    const currency = 'COP';
    const amountInCents = Math.round(amount * 100);

    // 1. Create pending transaction in DB
    const transaction = this.transactionRepo.create({
      reference,
      amount,
      currency,
      status: TransactionStatus.PENDING,
      user: { id: userId } as any,
      trip: tripId ? ({ id: tripId } as any) : undefined,
    });
    await this.transactionRepo.save(transaction);

    // 2. Integrity signature per Wompi spec: sha256(reference + amountInCents + currency + secret)
    const concatenation = `${reference}${amountInCents}${currency}${integritySecret}`;
    const integritySignature = crypto
      .createHash('sha256')
      .update(concatenation)
      .digest('hex');

    // 3. Build the real Wompi hosted checkout URL. The app opens this in an
    // in-app browser; Wompi handles the actual card/PSE flow and later calls
    // our /payments/webhook with the real result.
    const checkoutUrl =
      `https://checkout.wompi.co/p/?public-key=${encodeURIComponent(publicKey)}` +
      `&currency=${currency}` +
      `&amount-in-cents=${amountInCents}` +
      `&reference=${encodeURIComponent(reference)}` +
      `&signature:integrity=${integritySignature}` +
      `&redirect-url=${encodeURIComponent(redirectUrl)}`;

    return {
      checkoutUrl,
      publicKey,
      reference,
      amountInCents,
      currency,
      signature: integritySignature,
      transactionId: transaction.id,
    };
  }

  // Wompi signs every webhook event with a checksum computed from the
  // properties listed in `signature.properties`, the event `timestamp`, and
  // our private events secret. We must recompute it and compare before
  // trusting the payload — otherwise anyone could POST a fake "APPROVED".
  private verifyWebhookSignature(payload: any): boolean {
    const eventsSecret = this.configService.get<string>('WOMPI_EVENTS_SECRET');
    if (!eventsSecret) return false;

    const properties: string[] = payload?.signature?.properties;
    const checksum: string = payload?.signature?.checksum;
    const timestamp = payload?.timestamp;
    if (!properties?.length || !checksum || !timestamp) return false;

    const concatenatedValues = properties
      .map((path) =>
        path
          .split('.')
          .reduce((obj: any, key: string) => obj?.[key], payload.data),
      )
      .join('');

    const expected = crypto
      .createHash('sha256')
      .update(`${concatenatedValues}${timestamp}${eventsSecret}`)
      .digest('hex');

    return expected.toUpperCase() === String(checksum).toUpperCase();
  }

  async handleWebhook(payload: any) {
    if (!this.verifyWebhookSignature(payload)) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }

    const { reference, status, id: wompiId, amount_in_cents } =
      payload.data.transaction;

    const transaction = await this.transactionRepo.findOne({
      where: { reference },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    // Defensive check: the amount Wompi confirms must match what we asked for.
    const expectedCents = Math.round(Number(transaction.amount) * 100);
    if (amount_in_cents !== undefined && amount_in_cents !== expectedCents) {
      transaction.status = TransactionStatus.ERROR;
      transaction.wompiId = wompiId;
      return this.transactionRepo.save(transaction);
    }

    if (status === 'APPROVED') transaction.status = TransactionStatus.APPROVED;
    else if (status === 'DECLINED')
      transaction.status = TransactionStatus.DECLINED;
    else if (status === 'VOIDED') transaction.status = TransactionStatus.VOIDED;
    else transaction.status = TransactionStatus.ERROR;

    transaction.wompiId = wompiId;
    return this.transactionRepo.save(transaction);
  }

  async getTransactionByReference(reference: string, requestingUserId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { reference },
      relations: ['user'],
    });
    // No distinguimos "no existe" de "no es tuya" para no filtrar
    // información sobre transacciones de otros usuarios.
    if (!transaction || transaction.user.id !== requestingUserId) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }
}
