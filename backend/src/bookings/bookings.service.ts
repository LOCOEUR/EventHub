import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity.js';
import { Event } from '../events/entities/event.entity.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Injectable()
export class BookingsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
  ) {}

  async create(
    eventId: number,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    return await this.dataSource.transaction(async (manager) => {
      const event = await manager.findOne(Event, {
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException(`Événement #${eventId} introuvable.`);
      }

      if (event.availableSpots <= 0) {
        throw new BadRequestException(
          'Désolé, il n\'y a plus de places disponibles pour cet événement.',
        );
      }

      if (
        createBookingDto.ticketCategory &&
        event.ticketCategories?.length &&
        !event.ticketCategories.some(
          (category) => category.name === createBookingDto.ticketCategory,
        )
      ) {
        throw new BadRequestException(
          'La catégorie de billet sélectionnée est invalide.',
        );
      }

      event.availableSpots -= 1;
      await manager.save(Event, event);

      const booking = manager.create(Booking, {
        userName: createBookingDto.userName,
        userEmail: createBookingDto.userEmail,
        ticketCategory: createBookingDto.ticketCategory ?? null,
        eventId: event.id,
        event: event,
        status: BookingStatus.CONFIRMED,
      });

      return await manager.save(Booking, booking);
    });
  }

  async cancel(bookingId: string): Promise<Booking> {
    return await this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
        relations: { event: true },
      });

      if (!booking) {
        throw new NotFoundException(
          `Réservation avec l'ID ${bookingId} introuvable.`,
        );
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException(
          'Cette réservation a déjà été annulée.',
        );
      }

      booking.status = BookingStatus.CANCELLED;
      const savedBooking = await manager.save(Booking, booking);

      if (booking.event) {
        const event = await manager.findOne(Event, {
          where: { id: booking.event.id },
        });

        if (event) {
          event.availableSpots = Math.min(
            event.totalSpots,
            event.availableSpots + 1,
          );
          await manager.save(Event, event);
        }
      }

      return savedBooking;
    });
  }

  async findByEvent(eventId: number): Promise<Booking[]> {
    return await this.bookingsRepository.find({
      where: { eventId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: { event: true },
    });

    if (!booking) {
      throw new NotFoundException(`Réservation avec l'ID ${id} introuvable.`);
    }

    return booking;
  }
}
