import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { BookingStatus, Booking } from './entities/booking.entity.js';
import { Event } from '../events/entities/event.entity.js';

describe('BookingsService - Logique métier de réservation', () => {
  let service: BookingsService;
  let mockDataSource: any;
  let mockBookingsRepository: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      findOne: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
    };

    mockDataSource = {
      transaction: vi.fn().mockImplementation(async (callback: any) => {
        return await callback(mockEntityManager);
      }),
    };

    mockBookingsRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
    };

    service = new BookingsService(mockDataSource, mockBookingsRepository);
  });

  describe('create - Réservation d\'un ticket', () => {
    it('doit décrémenter le stock de places et confirmer la réservation si des places sont disponibles', async () => {
      const mockEvent: Partial<Event> = {
        id: 1,
        title: 'Festival des Grillades',
        totalSpots: 50,
        availableSpots: 10,
      };

      const dto = {
        userName: 'Aya Kouassi',
        userEmail: 'aya.kouassi@example.com',
      };

      const createdBooking: Partial<Booking> = {
        id: 'uuid-1234',
        userName: dto.userName,
        userEmail: dto.userEmail,
        eventId: 1,
        status: BookingStatus.CONFIRMED,
      };

      mockEntityManager.findOne.mockResolvedValueOnce(mockEvent);
      mockEntityManager.save.mockImplementation(async (_entityClass: any, entity: any) => entity);
      mockEntityManager.create.mockReturnValueOnce(createdBooking);

      const result = await service.create(1, dto);

      // Vérification 1 : le stock de places doit être décrémenté de 1 (10 -> 9)
      expect(mockEvent.availableSpots).toBe(9);
      expect(mockEntityManager.save).toHaveBeenCalledWith(Event, mockEvent);

      // Vérification 2 : la réservation est créée avec statut CONFIRMED
      expect(mockEntityManager.create).toHaveBeenCalledWith(Booking, expect.objectContaining({
        userName: 'Aya Kouassi',
        userEmail: 'aya.kouassi@example.com',
        eventId: 1,
        status: BookingStatus.CONFIRMED,
      }));
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('doit refuser la réservation et lever BadRequestException s\'il n\'y a plus de places (stock = 0)', async () => {
      const soldOutEvent: Partial<Event> = {
        id: 2,
        title: 'Atelier Céramique',
        totalSpots: 2,
        availableSpots: 0, // Complet
      };

      const dto = {
        userName: 'Koffi Konan',
        userEmail: 'koffi@example.com',
      };

      mockEntityManager.findOne
        .mockResolvedValueOnce(soldOutEvent)  // premier appel : vérification du type d'erreur
        .mockResolvedValueOnce(soldOutEvent); // deuxième appel : vérification du message d'erreur

      await expect(service.create(2, dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(2, dto)).rejects.toThrow(
        'Désolé, il n\'y a plus de places disponibles pour cet événement.',
      );

      // Aucun enregistrement ne doit être effectué
      expect(mockEntityManager.save).not.toHaveBeenCalled();
    });

    it('doit lever NotFoundException si l\'événement n\'existe pas', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(null);

      const dto = {
        userName: 'Aya Kouassi',
        userEmail: 'aya@example.com',
      };

      await expect(service.create(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel - Annulation d\'une réservation et libération de place', () => {
    it('doit passer le statut à CANCELLED et restituer une place disponible à l\'événement (+1)', async () => {
      const associatedEvent: Partial<Event> = {
        id: 1,
        totalSpots: 50,
        availableSpots: 12,
      };

      const existingBooking: Partial<Booking> = {
        id: 'booking-abc',
        userName: 'Aya Kouassi',
        status: BookingStatus.CONFIRMED,
        event: associatedEvent as Event,
      };

      mockEntityManager.findOne
        .mockResolvedValueOnce(existingBooking) // pour trouver la réservation
        .mockResolvedValueOnce(associatedEvent); // pour recharger l'événement et incrémenter

      mockEntityManager.save.mockImplementation(async (_entityClass: any, entity: any) => entity);

      const result = await service.cancel('booking-abc');

      // Vérification 1 : le statut de la réservation est CANCELLED
      expect(result.status).toBe(BookingStatus.CANCELLED);

      // Vérification 2 : la place de l'événement a bien été libérée (12 -> 13)
      expect(associatedEvent.availableSpots).toBe(13);
      expect(mockEntityManager.save).toHaveBeenCalledWith(Event, associatedEvent);
    });

    it('doit refuser l\'annulation si la réservation est déjà annulée', async () => {
      const alreadyCancelledBooking: Partial<Booking> = {
        id: 'booking-xyz',
        status: BookingStatus.CANCELLED,
      };

      mockEntityManager.findOne
        .mockResolvedValueOnce(alreadyCancelledBooking)  // premier appel
        .mockResolvedValueOnce(alreadyCancelledBooking); // deuxième appel

      await expect(service.cancel('booking-xyz')).rejects.toThrow(BadRequestException);
      await expect(service.cancel('booking-xyz')).rejects.toThrow(
        'Cette réservation a déjà été annulée.',
      );
    });

    it('doit lever NotFoundException si la réservation est introuvable', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(null);

      await expect(service.cancel('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });
});

