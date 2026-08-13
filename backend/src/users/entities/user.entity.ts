import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { SocialAccount } from './social-account.entity';
import { Role } from './role.entity';

// Role definitions moved to Role entity

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number;

  @OneToMany(() => SocialAccount, (social) => social.user)
  socialAccounts: SocialAccount[];

  @Column({ nullable: true })
  fcmToken: string;

  @Column({ nullable: true })
  hashedRefreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
