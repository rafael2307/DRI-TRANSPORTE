import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('social_accounts')
export class SocialAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider: string; // tiktok, facebook, google, etc.

  @Column()
  providerId: string;

  @ManyToOne(() => User, (user) => user.socialAccounts)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
