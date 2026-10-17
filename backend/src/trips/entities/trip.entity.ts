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

  // ----- Flujo recogida → destino → precio → subir oferta -----
  // Precio cotizado al pedir (tarifa real de Taxi o de la ruta de Viajes).
  @Column({ type: 'int', nullable: true })
  baseFare: number;

  // Precio vigente de la solicitud (>= baseFare). Sube cuando el pasajero sube la oferta.
  @Column({ type: 'int', nullable: true })
  offeredFare: number;

  // Cuántas veces subió la oferta (máximo 3).
  @Column({ type: 'smallint', default: 0 })
  raises: number;

  // Distancia aproximada en km (línea recta × 1,25).
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  distanceKm: number;

  // Puestos pedidos (solo Viajes; en Taxi siempre 1).
  @Column({ type: 'smallint', default: 1 })
  seats: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
