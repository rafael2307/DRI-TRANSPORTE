import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ServiceType } from '../../trips/entities/trip.entity';

export enum ConductorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('conductor_profiles')
  export class ConductorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

@OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

// Vehicle Photos
@Column({ nullable: true })
  vehicleFrontUrl: string;

@Column({ nullable: true })
  vehicleBackUrl: string;

@Column({ nullable: true })
  vehicleLeftUrl: string;

@Column({ nullable: true })
  vehicleRightUrl: string;

@Column({ nullable: true })
  vehicleInteriorUrl: string;

// Documents
@Column({ nullable: true })
  driverLicenseUrl: string;

@Column({ nullable: true })
  idCardUrl: string;

@Column({ nullable: true })
  profilePictureUrl: string;

@Column({
  type: 'enum',
  enum: ConductorStatus,
  default: ConductorStatus.PENDING,
})
  status: ConductorStatus;

@Column({
  type: 'enum',
  enum: ServiceType,
  default: ServiceType.URBAN,
})
  serviceType: ServiceType;

@Column({ default: false })
  isApproved: boolean;

// Opt-in explícito para los chequeos de bienestar/fatiga del asistente de
// IA durante los viajes. Falso por defecto: sin este consentimiento el
// conductor nunca recibe chequeos. Ver ASISTENTE_IA_PLUS.md.
@Column({ default: false })
  wellnessCheckInsEnabled: boolean;

@Column({ type: 'timestamp', nullable: true })
  wellnessConsentAt: Date | null;

@CreateDateColumn()
  createdAt: Date;

@UpdateDateColumn()
  updatedAt: Date;
}
