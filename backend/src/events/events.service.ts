import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';

@Injectable()
export class EventsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.eventsRepository.count();
    if (count === 0) {
      this.logger.log('Initialisation des événements de démonstration...');
      const inSevenDays = new Date();
      inSevenDays.setDate(inSevenDays.getDate() + 7);

      const inFourteenDays = new Date();
      inFourteenDays.setDate(inFourteenDays.getDate() + 14);

      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);

      await this.eventsRepository.save([
        {
          title: 'Festival des grillades',
          description: 'Célébration des saveurs avec animations et dégustations culinaires.',
          date: inSevenDays,
          location: 'Plateau, Abidjan',
          totalSpots: 50,
          availableSpots: 50,
          price: 3000,
        },
        {
          title: 'Conférence : L\'IA et la Création Artistique',
          description: 'Débat sur l\'impact des technologies génératives sur l\'art contemporain.',
          date: inFourteenDays,
          location: 'Musée des Arts, Abidjan',
          totalSpots: 30,
          availableSpots: 30,
          price: 0,
        },
        {
          title: 'Atelier Céramique & Poterie Traditionnelle',
          description: 'Atelier pratique en petit comité pour apprendre le tournage.',
          date: inThreeDays,
          location: 'Atelier Terres d\'Or, Bouaké',
          totalSpots: 2,
          availableSpots: 2,
          price: 15000,
        },
      ]);
    }
  }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventsRepository.create({
      ...createEventDto,
      date: new Date(createEventDto.date),
      availableSpots: createEventDto.totalSpots,
    });
    return await this.eventsRepository.save(event);
  }

  async findAll(): Promise<Event[]> {
    return await this.eventsRepository.find({
      order: { date: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Événement #${id} introuvable.`);
    }

    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    if (
      updateEventDto.totalSpots !== undefined &&
      updateEventDto.totalSpots !== event.totalSpots
    ) {
      const activeBookingsCount = event.totalSpots - event.availableSpots;

      if (updateEventDto.totalSpots < activeBookingsCount) {
        throw new BadRequestException(
          `Impossible de définir la capacité à ${updateEventDto.totalSpots} : ${activeBookingsCount} place(s) déjà réservée(s).`,
        );
      }

      const spotsDelta = updateEventDto.totalSpots - event.totalSpots;
      event.availableSpots += spotsDelta;
      event.totalSpots = updateEventDto.totalSpots;
    }

    if (updateEventDto.title !== undefined) event.title = updateEventDto.title;
    if (updateEventDto.description !== undefined)
      event.description = updateEventDto.description;
    if (updateEventDto.date !== undefined)
      event.date = new Date(updateEventDto.date);
    if (updateEventDto.location !== undefined)
      event.location = updateEventDto.location;
    if (updateEventDto.price !== undefined) event.price = updateEventDto.price;
    if (updateEventDto.ticketCategories !== undefined) {
      event.ticketCategories = updateEventDto.ticketCategories;
    }

    return await this.eventsRepository.save(event);
  }

  async remove(id: number): Promise<{ message: string }> {
    const event = await this.findOne(id);
    await this.eventsRepository.remove(event);
    return { message: `Événement #${id} supprimé.` };
  }
}
