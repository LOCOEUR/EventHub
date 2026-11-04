import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { Event } from './events/entities/event.entity.js';
import { Booking } from './bookings/entities/booking.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'events.sqlite',
      entities: [Event, Booking],
      synchronize: true, 
      logging: false,
    }),
    EventsModule,
    BookingsModule,
  ],
})
export class AppModule {}
