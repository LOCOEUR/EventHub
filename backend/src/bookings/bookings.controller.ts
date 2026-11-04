import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { Booking } from './entities/booking.entity.js';
import { AdminAuthGuard } from '../auth/admin-auth.guard.js';

@ApiTags('Bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('events/:eventId/bookings')
  @ApiOperation({ summary: 'Réserver un ticket pour un événement' })
  @ApiParam({ name: 'eventId', description: 'ID de l\'événement', type: Number })
  @ApiResponse({ status: 201, description: 'Ticket réservé avec succès.', type: Booking })
  @ApiResponse({ status: 400, description: 'Aucune place disponible ou données invalides.' })
  @ApiResponse({ status: 404, description: 'Événement introuvable.' })
  async createBooking(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    return await this.bookingsService.create(eventId, createBookingDto);
  }

  @Get('events/:eventId/bookings')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Lister les réservations d\'un événement' })
  @ApiParam({ name: 'eventId', description: 'ID de l\'événement', type: Number })
  @ApiResponse({ status: 200, description: 'Liste des réservations de l\'événement.', type: [Booking] })
  async findByEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<Booking[]> {
    return await this.bookingsService.findByEvent(eventId);
  }

  @Post('bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler une réservation et libérer une place' })
  @ApiParam({ name: 'id', description: 'ID UUID de la réservation', type: String })
  @ApiResponse({ status: 200, description: 'Réservation annulée avec succès.', type: Booking })
  @ApiResponse({ status: 400, description: 'Réservation déjà annulée.' })
  @ApiResponse({ status: 404, description: 'Réservation introuvable.' })
  async cancelBooking(@Param('id') id: string): Promise<Booking> {
    return await this.bookingsService.cancel(id);
  }

  @Get('bookings/:id')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Consulter les détails d\'une réservation' })
  @ApiParam({ name: 'id', description: 'ID UUID de la réservation', type: String })
  @ApiResponse({ status: 200, description: 'Détails de la réservation.', type: Booking })
  @ApiResponse({ status: 404, description: 'Réservation introuvable.' })
  async findOne(@Param('id') id: string): Promise<Booking> {
    return await this.bookingsService.findOne(id);
  }
}
