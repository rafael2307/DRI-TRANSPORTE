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

// Estado de la conversación de WhatsApp con un número de teléfono. Es una
// máquina de estados simple que vive igual en modo simulado que en modo
// real: no depende de tener credenciales de WhatsApp Business API (ver
// WhatsAppService) para poder probar el flujo completo end-to-end.
export enum WhatsAppSessionState {
  IDLE = 'IDLE',
  AWAITING_LOCATION = 'AWAITING_LOCATION',
  AWAITING_DESTINATION = 'AWAITING_DESTINATION',
  CONFIRMING = 'CONFIRMING',
}

// Un registro por número de WhatsApp, no por usuario: el mismo número puede
// escribirnos antes de que lo vinculemos a una cuenta (o sin tener una
// cuenta en absoluto). Ver WhatsAppService para el flujo completo y
// WHATSAPP_INTEGRATION.md para qué es real y qué sigue fuera de alcance.
@Entity('whatsapp_sessions')
  export class WhatsAppSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

@Column({ unique: true })
  @Index()
  phone: string;

@ManyToOne(() => User, { nullable: true })
  user: User | null;

@Column({
  type: 'enum',
  enum: WhatsAppSessionState,
  default: WhatsAppSessionState.IDLE,
})
  state: WhatsAppSessionState;

@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  pickupLat: number | null;

@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  pickupLng: number | null;

@Column({ nullable: true })
  pickupName: string | null;

@Column({ nullable: true })
  destinationName: string | null;

@Column({ nullable: true })
  serviceType: string | null;

@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedFare: number | null;

// Último viaje creado desde esta conversación, solo como referencia para
// el propio pasajero ("¿qué pasó con mi pedido?"). El seguimiento real del
// viaje (estado, conductor asignado) sigue viviendo en la app, no acá.
@Column({ nullable: true })
  lastTripId: string | null;

@CreateDateColumn()
  createdAt: Date;

@UpdateDateColumn()
  updatedAt: Date;
}
