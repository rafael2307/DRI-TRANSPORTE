import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_configs')
export class PaymentConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  routeName: string; // E.g., "Centro - Aeropuerto"

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ default: false })
  isFree: boolean; // Flag requested for "free seasons"

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
