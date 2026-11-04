import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Nom et prénom du participant',
    example: 'Aya Kouassi',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(150)
  userName: string;

  @ApiProperty({
    description: 'Adresse e-mail valide pour recevoir la confirmation',
    example: 'aya.kouassi@example.com',
  })
  @IsEmail({}, { message: 'Veuillez renseigner une adresse email valide' })
  @IsNotEmpty({ message: 'L\'email est obligatoire' })
  @MaxLength(150)
  userEmail: string;

  @ApiProperty({
    description: 'Catégorie de billet choisie',
    example: 'VIP',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ticketCategory?: string;
}
