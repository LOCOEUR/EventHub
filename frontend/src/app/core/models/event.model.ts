export interface BookingItem {
  id: string;
  userName: string;
  userEmail: string;
  ticketCategory?: string;
  status: 'CONFIRMED' | 'CANCELLED';
  eventId: number;
  createdAt: string;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  totalSpots: number;
  availableSpots: number;
  price: number;
  ticketCategories?: TicketCategory[];
  bookings?: BookingItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  date: string;
  location: string;
  totalSpots: number;
  price?: number;
  ticketCategories?: TicketCategory[];
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  totalSpots?: number;
  price?: number;
  ticketCategories?: TicketCategory[];
}

export interface TicketCategory {
  name: string;
  price: number;
}

export interface CreateBookingPayload {
  userName: string;
  userEmail: string;
  ticketCategory?: string;
}
