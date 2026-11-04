import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TicketCategoryDto } from './create-event.dto.js';

export class UpdateEventDto {
  @ApiPropertyOptional({
    description: 'Titre de l\'événement',
    example: 'Concert de Dena mwana',
  })
  @IsOptional()
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Description de l\'événement',
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Date et heure de l\'événement',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date doit être au format ISO valide' })
  date?: string;

  @ApiPropertyOptional({
    description: 'Lieu de l\'événement',
  })
  @IsOptional()
  @IsString({ message: 'Le lieu doit être une chaîne de caractères' })
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'Capacité totale de places',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le nombre de places doit être un entier' })
  @Min(1, { message: 'L\'événement doit comporter au moins 1 place' })
  totalSpots?: number;

  @ApiPropertyOptional({
    description: 'Prix du billet en FCFA (0 = entrée libre)',
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le prix doit être un entier en FCFA' })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Catégories de billets et leurs prix',
    type: 'array',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TicketCategoryDto)
  ticketCategories?: TicketCategoryDto[];
}
