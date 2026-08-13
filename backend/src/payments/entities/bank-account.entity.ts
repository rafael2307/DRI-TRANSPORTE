import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BankProvider {
  NEQUI = 'NEQUI',
  BANCOLOMBIA = 'BANCOLOMBIA',
  DAVIPLATA = 'DAVIPLATA',
}

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: BankProvider,
  })
  provider: BankProvider;

  @Column()
  accountNumber: string;

  @Column()
  accountHolderName: string;

  @Column()
  documentNumber: string;

  @CreateDateColumn()
  createdAt: Date;
}
