import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Por qué se disparó el chequeo. Por ahora solo existe el programado
// (cada cierto tiempo de viaje activo); los disparadores por patrón de
// manejo (frenada brusca, velocidad errática) quedan para una siguiente
// vuelta, cuando la app mande telemetría real del dispositivo.
export enum WellnessTrigger {
  SCHEDULED = 'SCHEDULED',
}

// Registro auditable de cada chequeo de bienestar que el asistente le hizo
// a un conductor y su respuesta. Existe para que el conductor (y quien
// revise el sistema) pueda ver exactamente qué se le preguntó y qué
// respondió — nunca se usa para penalizar automáticamente a nadie, ver
// ASISTENTE_IA_PLUS.md.
@Entity('wellness_check_ins')
  export class WellnessCheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

@ManyToOne(() => User, { nullable: false })
  driver: User;

@Column({
  type: 'enum',
  enum: WellnessTrigger,
  default: WellnessTrigger.SCHEDULED,
})
  trigger: WellnessTrigger;

@Column()
  promptMessage: string;

@Column({ nullable: true, type: 'text' })
  response: string | null;

@Column({ default: false })
  flagged: boolean;

@CreateDateColumn()
  promptedAt: Date;

@Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null;
}
