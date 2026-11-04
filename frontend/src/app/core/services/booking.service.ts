import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  BookingItem,
  CreateBookingPayload,
} from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  createBooking(
    eventId: number,
    payload: CreateBookingPayload,
  ): Observable<BookingItem> {
    return this.http
      .post<BookingItem>(`${this.baseUrl}/events/${eventId}/bookings`, payload)
      .pipe(catchError(this.handleError));
  }

  getEventBookings(eventId: number): Observable<BookingItem[]> {
    return this.http
      .get<BookingItem[]>(`${this.baseUrl}/events/${eventId}/bookings`)
      .pipe(catchError(this.handleError));
  }

  cancelBooking(bookingId: string): Observable<BookingItem> {
    return this.http
      .post<BookingItem>(`${this.baseUrl}/bookings/${bookingId}/cancel`, {})
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la réservation.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau : ${error.error.message}`;
    } else if (error.error && error.error.message) {
      if (Array.isArray(error.error.message)) {
        errorMessage = error.error.message.join(' • ');
      } else {
        errorMessage = error.error.message;
      }
    } else if (error.status === 0) {
      errorMessage =
        'Impossible de contacter le serveur backend. Veuillez vérifier son statut.';
    } else {
      errorMessage = `Erreur (${error.status}) : ${error.statusText}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}

