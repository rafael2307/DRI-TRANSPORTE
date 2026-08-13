import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { PaymentConfig } from './entities/payment-config.entity';
import { BankAccount, BankProvider } from './entities/bank-account.entity';
import { Withdrawal, WithdrawalStatus } from './entities/withdrawal.entity';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
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

  async requestWithdrawal(
    user: User,
    data: { bankAccountId: string; amount: number },
  ) {
    const bankAccount = await this.bankRepo.findOne({
      where: { id: data.bankAccountId, user: { id: user.id } },
    });
    if (!bankAccount)
      throw new Error('Bank account not found or does not belong to user');

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
    const reference = `TRX_${Date.now()}_${userId.slice(0, 4)}`;

    // 1. Create pending transaction in DB
    const transaction = this.transactionRepo.create({
      reference,
      amount,
      currency: 'COP',
      status: TransactionStatus.PENDING,
      user: { id: userId } as any,
      trip: tripId ? ({ id: tripId } as any) : undefined,
    });
    await this.transactionRepo.save(transaction);

    // 2. Generate Integrity Secret (In real app, get from ConfigService)
    const integritySecret = 'test_integrity_12345'; // MOCK
    const publicKey = 'pub_test_12345'; // MOCK

    const concatenation = `${reference}${amount * 100}COP${integritySecret}`;
    const integritySignature = crypto
      .createHash('sha256')
      .update(concatenation)
      .digest('hex');

    return {
      publicKey,
      reference,
      amountInCents: amount * 100,
      currency: 'COP',
      signature: integritySignature,
      transactionId: transaction.id,
    };
  }

  async handleWebhook(payload: any) {
    const { reference, status, id: wompiId } = payload.data.transaction;

    const transaction = await this.transactionRepo.findOne({
      where: { reference },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    if (status === 'APPROVED') transaction.status = TransactionStatus.APPROVED;
    else if (status === 'DECLINED')
      transaction.status = TransactionStatus.DECLINED;
    else if (status === 'VOIDED') transaction.status = TransactionStatus.VOIDED;
    else transaction.status = TransactionStatus.ERROR;

    transaction.wompiId = wompiId;
    return this.transactionRepo.save(transaction);
  }
}
