# EventHub — Gestion d'Événements & Billetterie en Ligne

Ce projet est un prototype d'application web complète pour une startup organisant des événements culturels. Il est composé de deux interfaces distinctes : une billetterie grand public et un espace d'administration / gestion avec tableau de bord.

---

## Architecture de l'Application

### 1. Interface Publique (Visiteurs / Participants)
URL : `http://localhost:4200/`
 Consultation du catalogue d'événements culturels.
 Visualisation des détails et de la disponibilité en temps réel.
 Réservation de tickets avec validation stricte et refus en cas d'événement complet.
 Confirmation du billet et possibilité pour le participant d'annuler sa réservation (libération immédiate de la place).

### 2. Interface de Gestion (Organisateurs)
URL : `http://localhost:4200/login` (accès direct réservé aux administrateurs, masqué au public)
Accès protégé par `AuthGuard`
Identifiants de démonstration :
  Email : `admin@eventhub.com`
  Mot de passe : `admin123`
  Tableau de bord minimaliste (`/admin`) :
   Indicateurs clés (KPIs) : total des événements, billets réservés, places restantes.
   Gestion complète des événements : création (`/admin/events/new`), modification (`/admin/events/:id/edit`), suppression.
   Configuration de catégories de billets personnalisées par événement, avec un prix en FCFA pour chaque catégorie (par exemple Public ou VIP).
   Consultation détaillée des participants inscrits avec possibilité d'annuler une réservation pour restituer la place.


## Contraintes techniques
Backend
•	Framework : NestJS
•	Base de données : SQLite avec TypeORM
•	Valider les entrées avec class-validator
•	Documenter l'API avec Swagger (@nestjs/swagger)
•	Organiser le code en modules NestJS (un module par domaine métier)
Frontend
•	Framework: Angular (dernière version stable)
•	Utiliser des standalone components
•	Utiliser des Reactive Forms avec validation
•	Centraliser les appels HTTP dans des services
•	Gérer et afficher les erreurs retournées par l'API


## Règle métier critique : Stock & Intégrité
1.Création d'un événement : `availableSpots` est initialisé à la valeur de `totalSpots`.
2.Réservation: Vérification dans une transaction atomique que `availableSpots > 0`. Décrémentation de `availableSpots` et enregistrement du ticket. Si `availableSpots == 0`, l'API renvoie un statut HTTP 400 Bad Request ("Plus de places disponibles").
3.Annulation : Le statut du ticket passe à `CANCELLED` et la place est immédiatement restituée à l'événement (`availableSpots + 1`).
4.Mise à jour de la capacité : Si l'administrateur réduit la capacité totale, l'API s'assure que la nouvelle valeur ne soit pas inférieure au nombre de places déjà réservées.


## Démarrage 

### Prérequis
* [Node.js](https://nodejs.org/) (v20+)

### 1. Backend 
Dans un terminal :
```bash
cd backend
npm install
npm run start:dev
```
* API REST : `http://localhost:3000/api`
* Swagger : `http://localhost:3000/api/docs`

### 2. Frontend 
Dans un second terminal :
```bash
cd frontend
npm install
npm start
```
* Application : `http://localhost:4200`

---

## Endpoints de l'API

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/events` | Liste tous les événements (avec capacité restante) |
| `POST` | `/api/events` | Crée un événement (`title`, `description`, `date`, `location`, `totalSpots`, `price`, `ticketCategories`) |
| `GET` | `/api/events/:id` | Détails d'un événement avec ses réservations |
| `PUT` | `/api/events/:id` | Modifie un événement |
| `DELETE` | `/api/events/:id` | Supprime un événement |
| `POST` | `/api/events/:id/bookings` | Réserve un ticket (`userName`, `userEmail`, `ticketCategory`) |
| `GET` | `/api/events/:id/bookings` | Liste les réservations d'un événement |
| `POST` | `/api/bookings/:id/cancel` | Annule une réservation et libère une place |
| `GET` | `/api/bookings/:id` | Détails d'une réservation spécifique |
