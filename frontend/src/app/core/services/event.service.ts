import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  EventItem,
  CreateEventPayload,
  UpdateEventPayload,
} from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly apiUrl = 'http://localhost:3000/api/events';

  constructor(private readonly http: HttpClient) {}

  getEvents(): Observable<EventItem[]> {
    return this.http
      .get<EventItem[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getEvent(id: number): Observable<EventItem> {
    return this.http
      .get<EventItem>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createEvent(payload: CreateEventPayload): Observable<EventItem> {
    return this.http
      .post<EventItem>(this.apiUrl, payload)
      .pipe(catchError(this.handleError));
  }

  updateEvent(id: number, payload: UpdateEventPayload): Observable<EventItem> {
    return this.http
      .put<EventItem>(`${this.apiUrl}/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteEvent(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inattendue est survenue.';

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
        'Impossible de contacter le serveur backend. Veuillez vérifier qu\'il est bien démarré sur le port 3000.';
    } else {
      errorMessage = `Erreur serveur (${error.status}) : ${error.statusText}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}

