import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TripStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceType {
  URBAN = 'URBAN',
  INTERMUNICIPAL = 'INTERMUNICIPAL',
}

@Entity('trips')
@Index(['status'])
@Index(['createdAt'])
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  passenger: User;

  @ManyToOne(() => User, { nullable: true })
  driver: User;

  @Column()
  pickupLocationName: string;

  @Column('decimal', { precision: 10, scale: 7 })
  pickupLat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  pickupLng: number;

  @Column()
  destinationName: string;

  @Column('decimal', { precision: 10, scale: 7 })
  destinationLat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  destinationLng: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  fare: number;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.REQUESTED,
  })
  status: TripStatus;

  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.URBAN,
  })
  serviceType: ServiceType;

  @Column({ default: false })
  isFree: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
