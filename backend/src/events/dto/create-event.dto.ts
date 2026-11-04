import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty({
    description: 'Titre de l\'événement',
    example: 'Festival des Grillades & Musiques Urbaines',
  })
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Description détaillée de l\'événement',
    example: 'Un grand rassemblement festif mêlant gastronomie, concerts live et ateliers artisanaux.',
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La description est obligatoire' })
  description: string;

  @ApiProperty({
    description: 'Date et heure de l\'événement (format ISO 8601)',
    example: '2026-12-15T20:30:00.000Z',
  })
  @IsDateString({}, { message: 'La date doit être au format ISO valide (ex: 2026-12-15T20:30:00.000Z)' })
  @IsNotEmpty({ message: 'La date est obligatoire' })
  date: string;

  @ApiProperty({
    description: 'Lieu ou adresse de l\'événement',
    example: 'Palais de la Culture, Abidjan',
  })
  @IsString({ message: 'Le lieu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le lieu est obligatoire' })
  @MaxLength(255)
  location: string;

  @ApiProperty({
    description: 'Nombre total de places disponibles à la vente',
    example: 100,
  })
  @Type(() => Number)
  @IsInt({ message: 'Le nombre de places doit être un entier' })
  @Min(1, { message: 'L\'événement doit comporter au moins 1 place' })
  totalSpots: number;

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
    example: [{ name: 'Public', price: 5000 }, { name: 'VIP', price: 15000 }],
    type: 'array',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TicketCategoryDto)
  ticketCategories?: TicketCategoryDto[];
}

export class TicketCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price: number;
}
