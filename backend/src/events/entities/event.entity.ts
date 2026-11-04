import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  type Relation,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity.js';

export interface TicketCategory {
  name: string;
  price: number;
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'integer' })
  totalSpots: number;

  @Column({ type: 'integer' })
  availableSpots: number;

  @Column({ type: 'integer', default: 0 })
  price: number;

  @Column({ type: 'simple-json', nullable: true })
  ticketCategories: TicketCategory[] | null;

  @OneToMany(() => Booking, (booking) => booking.event)
  bookings: Relation<Booking[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
