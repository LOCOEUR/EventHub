import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { EventsService } from './events.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { Event } from './entities/event.entity.js';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel événement' })
  @ApiResponse({ status: 201, description: 'Événement créé avec succès.', type: Event })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  async create(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return await this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste de tous les événements' })
  @ApiResponse({ status: 200, description: 'Liste des événements.', type: [Event] })
  async findAll(): Promise<Event[]> {
    return await this.eventsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer les détails d\'un événement par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'événement', type: Number })
  @ApiResponse({ status: 200, description: 'Événement trouvé.', type: Event })
  @ApiResponse({ status: 404, description: 'Événement introuvable.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Event> {
    return await this.eventsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un événement existant' })
  @ApiParam({ name: 'id', description: 'ID de l\'événement', type: Number })
  @ApiResponse({ status: 200, description: 'Événement mis à jour avec succès.', type: Event })
  @ApiResponse({ status: 400, description: 'Données invalides ou capacité incompatible.' })
  @ApiResponse({ status: 404, description: 'Événement introuvable.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    return await this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un événement' })
  @ApiParam({ name: 'id', description: 'ID de l\'événement', type: Number })
  @ApiResponse({ status: 200, description: 'Événement supprimé avec succès.' })
  @ApiResponse({ status: 404, description: 'Événement introuvable.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return await this.eventsService.remove(id);
  }
}

