import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity.js';

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  userName: string;

  @Column({ type: 'varchar', length: 150 })
  userEmail: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ticketCategory: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: BookingStatus.CONFIRMED,
  })
  status: BookingStatus;

  @Column({ type: 'integer' })
  eventId: number;

  @ManyToOne(() => Event, (event) => event.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: Relation<Event>;

  @CreateDateColumn()
  createdAt: Date;
}
