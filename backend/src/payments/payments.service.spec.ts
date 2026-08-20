import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentConfig } from './entities/payment-config.entity';
import { BankAccount } from './entities/bank-account.entity';
import { Withdrawal, WithdrawalStatus } from './entities/withdrawal.entity';
import { Transaction } from './entities/transaction.entity';
import { Trip } from '../trips/entities/trip.entity';

// Minimal stand-in for TypeORM's QueryBuilder, just enough to support the
// select().where().andWhere().getRawOne() chain used by
// PaymentsService.getDriverBalance().
const mockQueryBuilder = (total: string) => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total }),
});

describe('PaymentsService', () => {
      let service: PaymentsService;
      let withdrawalRepo: any;
      let bankRepo: any;

           const mockPaymentConfigRepo = {};
      const mockBankAccountRepo = {
              findOne: jest.fn(),
      };
      const mockWithdrawalRepo = {
              create: jest.fn().mockImplementation((dto) => dto),
              save: jest
                .fn()
                .mockImplementation((dto) =>
                            Promise.resolve({ id: 'withdrawal-id', ...dto }),
                                          ),
              find: jest.fn(),
              // No hay retiros previos en estos tests, así que el total retirado es 0.
              createQueryBuilder: jest.fn(() => mockQueryBuilder('0')),
      };
      const mockTransactionRepo = {
              find: jest.fn(),
              save: jest.fn(),
      };
      // Saldo ganado suficiente para que el retiro de prueba (100) sea válido.
           const mockTripRepo = {
                   createQueryBuilder: jest.fn(() => mockQueryBuilder('500')),
           };
      // No se usa Wompi en estos tests; alcanza con un stub sin valores reales.
           const mockConfigService = {
                   get: jest.fn(),
           };

           beforeEach(async () => {
                   const module: TestingModule = await Test.createTestingModule({
                             providers: [
                                         PaymentsService,
                                 {
                                               provide: getRepositoryToken(PaymentConfig),
                                               useValue: mockPaymentConfigRepo,
                                 },
                                 {
                                               provide: getRepositoryToken(BankAccount),
                                               useValue: mockBankAccountRepo,
                                 },
                                 {
                                               provide: getRepositoryToken(Withdrawal),
                                               useValue: mockWithdrawalRepo,
                                 },
                                 {
                                               provide: getRepositoryToken(Transaction),
                                               useValue: mockTransactionRepo,
                                 },
                                 {
                                               provide: getRepositoryToken(Trip),
                                               useValue: mockTripRepo,
                                 },
                                 {
                                               provide: ConfigService,
                                               useValue: mockConfigService,
                                 },
                                       ],
                   }).compile();

                          service = module.get<PaymentsService>(PaymentsService);
                   withdrawalRepo = module.get(getRepositoryToken(Withdrawal));
                   bankRepo = module.get(getRepositoryToken(BankAccount));
           });

           it('should be defined', () => {
                   expect(service).toBeDefined();
           });

           it('should request a withdrawal', async () => {
                   const user = { id: 'user-id' } as any;
                   const bankAccount = { id: 'bank-id', user: { id: 'user-id' } };
                   bankRepo.findOne.mockResolvedValue(bankAccount);

                  const result = await service.requestWithdrawal(user, {
                            bankAccountId: 'bank-id',
                            amount: 100,
                  });

                  expect(result.amount).toBe(100);
                   expect(result.status).toBe(WithdrawalStatus.PENDING);
                   expect(withdrawalRepo.save).toHaveBeenCalled();
           });

           it('should throw error if bank account not found or not owned by user', async () => {
                   const user = { id: 'user-id' } as any;
                   bankRepo.findOne.mockResolvedValue(null);

                  await expect(
                            service.requestWithdrawal(user, {
                                        bankAccountId: 'bank-id',
                                        amount: 100,
                            }),
                          ).rejects.toThrow('Bank account not found or does not belong to user');
           });

           it('should reject a withdrawal larger than the available balance', async () => {
                   const user = { id: 'user-id' } as any;
                   const bankAccount = { id: 'bank-id', user: { id: 'user-id' } };
                   bankRepo.findOne.mockResolvedValue(bankAccount);

                  // El saldo disponible mockeado es 500 (earnings) - 0 (retirado) = 500.
                  await expect(
                            service.requestWithdrawal(user, {
                                        bankAccountId: 'bank-id',
                                        amount: 1000,
                            }),
                          ).rejects.toThrow('Saldo insuficiente');
           });
});
