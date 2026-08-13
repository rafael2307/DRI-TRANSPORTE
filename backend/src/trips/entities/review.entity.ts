import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Trip } from '../../trips/entities/trip.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Trip, { nullable: false })
  @JoinColumn()
  trip: Trip;

  @ManyToOne(() => User, { nullable: false })
  reviewer: User;

  @ManyToOne(() => User, { nullable: false })
  reviewee: User;

  @Column('int')
  rating: number;

  @Column({ nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
