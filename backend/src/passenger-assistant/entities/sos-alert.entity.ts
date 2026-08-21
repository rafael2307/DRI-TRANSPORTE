import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Trip } from '../../trips/entities/trip.entity';

// Estado del alerta. No hay un flujo de despacho/resolución automático
// todavía (eso requeriría un panel operativo real que no existe hoy) — por
// ahora esto es un registro auditable de que la alerta se disparó y a quién
// se le notificó, no un sistema de respuesta a emergencias en sí mismo.
export enum SosAlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
}

// Registro auditable de cada alerta de pánico/SOS que un pasajero activó
// durante un viaje, con la ubicación exacta en el momento del disparo. Ver
// ASISTENTE_IA_PLUS.md — misma filosofía que WellnessCheckIn: transparencia
// y trazabilidad ante todo.
@Entity('sos_alerts')
  export class SosAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

@ManyToOne(() => Trip, { nullable: false })
  trip: Trip;

@ManyToOne(() => User, { nullable: false })
  passenger: User;

@Column('decimal', { precision: 10, scale: 7 })
  lat: number;

@Column('decimal', { precision: 10, scale: 7 })
  lng: number;

@Column({
  type: 'enum',
  enum: SosAlertStatus,
  default: SosAlertStatus.ACTIVE,
})
  status: SosAlertStatus;

@Column({ default: false })
  driverNotified: boolean;

@CreateDateColumn()
  createdAt: Date;

@Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date | null;
}
