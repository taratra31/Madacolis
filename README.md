# MadaColis — Plateforme de livraison de colis Madagascar ↔ France

Plateforme de livraison de colis entre **Madagascar** et **France**.

| Couche       | Technologie                          |
| ------------ | ------------------------------------ |
| Backend      | Node.js + Express.js + TypeScript    |
| Base de données | PostgreSQL                        |
| ORM          | Prisma                               |
| Validation   | Zod                                  |
| Auth         | JWT + bcrypt                         |
| Conteneurs   | Docker Compose                       |
| Frontend     | React.js + Vite + Tailwind (`frontend/` admin, `frontend-client/` client) |

---

## État d'avancement

- ✅ **PHASE 1** — Infra Node.js + TypeScript + Express, PostgreSQL (Docker), Prisma, schema complet, migration initiale, seed, docker-compose, README.
- ✅ **PHASE 2** — Authentification (register/login/logout/me/profile/password), middlewares JWT/bcrypt/roles, gestion des adresses.
- ✅ **PHASE 6 (admin)** — Admin API complète (dashboard, users, shipments+statuts, payments, pricing-rules, audits) + **console d'administration React**.
- ✅ **PHASE 3** — Shipments client (création en 4 étapes, annulation, suivi) + tracking public.
- ✅ **PHASE 4** — Pricing service public `/pricing/quote` + `/pricing/services` + **portail client React** (pages publiques, espace client : colis, suivi, paiements, documents, profil).
- ⏳ **PHASE 5** — Paiements (initiation client faite ; webhooks MVola/Orange/Airtel à venir).
- ⏳ **PHASE 7** — Tests automatisés.

---

## Structure

```
madacolis/
├── backend/
│   ├── src/
│   │   ├── config/          # env, prisma client, configuration
│   │   ├── controllers/     # (PHASE 2+)
│   │   ├── routes/          # (PHASE 2+)
│   │   ├── middlewares/     # (PHASE 2+)
│   │   ├── services/        # (PHASE 4+)
│   │   ├── validators/      # (PHASE 2+)
│   │   ├── types/           # (PHASE 2+)
│   │   ├── utils/           # (PHASE 2+)
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma    # 10 modèles + enums
│   │   ├── migrations/
│   │   └── seed.ts          # données de démonstration
│   ├── tests/
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Console d'administration React + Vite
├── frontend-client/         # Portail client React + Vite (pages publiques + espace client)
├── docker-compose.yml       # postgres + pgadmin + backend
└── README.md
```

---

## Installation

### Prérequis

- Node.js ≥ 20
- Docker + Docker Compose (ou Colima sur macOS)
- npm

### 1. Démarrer PostgreSQL (Docker)

```bash
docker compose up -d postgres pgadmin
```

- PostgreSQL → `localhost:5433` (le port _5432_ peut être occupé par un PostgreSQL local)
- pgAdmin → http://localhost:5050 (admin@madacolis.mg / admin)

> Configuration du projet : voir `.env` (déjà créé pour le dev).

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Serveur → http://localhost:5000

### 3. Vérification

```bash
curl http://localhost:5000/api/v1/health
curl http://localhost:5000/
```

---

## Base de données

Le schéma Prisma (`backend/prisma/schema.prisma`) contient :

| Modèle | Rôle |
| ------ | ---- |
| `User` | Comptes (CUSTOMER, ADMIN, AGENT) |
| `Address` | Adresses des utilisateurs |
| `Shipment` | Colis avec numéro de tracking unique |
| `ShipmentItem` | Articles d'un colis |
| `ShipmentStatusHistory` | Historique des statuts |
| `PricingRule` | Règles tarifaires par route + service |
| `DistanceRate` | Distances ville → ville |
| `Payment` | Paiements (MVola, Orange, Airtel, Carte) |
| `Document` | Documents d'un colis (douane, facture…) |
| `AuditLog` | Journal d'audit |

### Commandes Prisma

```bash
npx prisma generate        # régénère le client
npx prisma migrate dev     # applique les migrations en dev
npx prisma migrate deploy  # applique les migrations en production
npx prisma db seed         # injecte les données de démo
npx prisma studio          # interface d'administration visuelle
```

---

## Seed — données de démonstration

Tarifs **fictifs** à remplacer en production.

| Utilisateur | Email | Mot de passe | Rôle |
| ----------- | ----- | ------------ | ---- |
| Admin | admin@madacolis.mg | Admin@123 | ADMIN |
| Agent | agent@madacolis.mg | Agent@123 | AGENT |
| Client | customer@madacolis.mg | Customer@123 | CUSTOMER |

6 règles tarifaires (Mada → France et France → Mada, en STANDARD/EXPRESS/ECONOMY, en EUR)
et des distances de démonstration (Antananarivo ↔ Paris, etc.).

---

## Variables d'environnement

`.env.example` (racine et `backend/.env.example`) :

| Variable | Description |
| -------- | ----------- |
| `PORT` | Port du serveur (5000) |
| `NODE_ENV` | development / test / production |
| `DATABASE_URL` | URL PostgreSQL (host localhost:5433) |
| `JWT_SECRET` | Secret de signature JWT |
| `JWT_EXPIRES_IN` | Durée de validité (7d) |
| `FRONTEND_URL` | Origine CORS du frontend |
| `POSTGRES_USER/PASSWORD/DB` | Credentials Docker |
| `PGADMIN_EMAIL/PASSWORD` | Credentials pgAdmin |

> Les secrets dans `.env` ne doivent jamais être committés.

---

## Docker Compose

```bash
docker compose up -d              # tout (postgres + pgadmin + backend)
docker compose up -d postgres     # base seule
docker compose down               # arrêt
docker compose logs -f backend    # logs backend
```

Dockerfile multi-stage : build TS → image Node 24-alpine (runtime). En production, l'image exécute `prisma migrate deploy` puis `node dist/server.js`.

---

## API (état actuel)

| Méthode | Route | Description | Auth |
| ------- | ----- | ----------- | ---- |
| GET | `/api/v1` | Liste des endpoints | — |
| GET | `/api/v1/health` | Health check | — |
| POST | `/api/v1/auth/register` | Créer un compte | — |
| POST | `/api/v1/auth/login` | Connexion → JWT | — |
| POST | `/api/v1/auth/logout` | Déconnexion | ✅ |
| GET | `/api/v1/auth/me` | Profil courant | ✅ |
| PUT | `/api/v1/auth/profile` | Mettre à jour le profil | ✅ |
| PUT | `/api/v1/auth/password` | Changer le mot de passe | ✅ |
| GET/POST | `/api/v1/addresses` | Liste / création d'adresses | ✅ |
| GET/PUT/DELETE | `/api/v1/addresses/:id` | Détail / maj / suppression (propriétaire) | ✅ |
| GET | `/api/v1/admin/dashboard` | Statistiques (ADMIN) | ✅ ADMIN |
| GET | `/api/v1/admin/users` | Liste des utilisateurs | ✅ ADMIN |
| PUT | `/api/v1/admin/users/:id` | Changer rôle / activité | ✅ ADMIN |
| DELETE | `/api/v1/admin/users/:id` | Supprimer définitivement un utilisateur | ✅ ADMIN |
| GET | `/api/v1/admin/shipments` | Liste des colis | ✅ ADMIN/AGENT |
| PUT | `/api/v1/admin/shipments/:id/status` | Mettre à jour le statut (+historique) | ✅ ADMIN |
| GET | `/api/v1/admin/payments` | Liste des paiements | ✅ ADMIN/AGENT |
| GET/POST/PUT/DELETE | `/api/v1/admin/pricing-rules` | CRUD règles tarifaires | ✅ ADMIN |
| GET | `/api/v1/admin/audits` | Journal d'audit | ✅ ADMIN |
| GET | `/api/v1/pricing/services` | Liste des services et tarifs de base | — |
| POST | `/api/v1/pricing/quote` | Estimer le prix d'un colis (poids + volumétrique) | — |
| GET | `/api/v1/shipments` | Liste des colis de l'utilisateur (filtres, pagination) | ✅ |
| POST | `/api/v1/shipments` | Créer un envoi (devis recalculé côté serveur) | ✅ |
| GET | `/api/v1/shipments/:id` | Détail d'un colis (articles, historique, paiements, documents) | ✅ |
| GET | `/api/v1/shipments/:id/tracking` | Suivi détaillé d'un colis | ✅ |
| POST | `/api/v1/shipments/:id/cancel` | Annuler un colis (statut PENDING uniquement) | ✅ |
| GET | `/api/v1/tracking/:trackingNumber` | Tracking public (anonyme) | — |
| GET | `/api/v1/payments` | Historique des paiements de l'utilisateur | ✅ |
| POST | `/api/v1/payments` | Initier un paiement (référence + statut PENDING) | ✅ |
| GET | `/api/v1/documents` | Documents de l'utilisateur | ✅ |

Exemples de connexion :

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@madacolis.mg","password":"Admin@123"}'

curl http://localhost:5000/api/v1/admin/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

Toutes les routes admin sont protégées par JWT + rôles (ADMIN/AGENT). Les actions sensibles sont journalisées dans `AuditLog`.

### Documentation Swagger

La spécification OpenAPI 3.0 est générée côté backend :

- **UI interactive** : http://localhost:5000/api/v1/docs
- **Spécification JSON** : http://localhost:5000/api/v1/docs/json

Swagger documente toutes les routes (auth, adresses, admin) avec schémas et réponses. L'authentification se fait via le bouton **Authorize** en collant le token JWT.

---

## Console d'administration (frontend)

Interface React + Vite + Tailwind dans `frontend/` — accès : **http://localhost:5176**

```bash
cd frontend
npm install
npm run dev
```

- **Login** : admin@madacolis.mg / Admin@123
- **Dashboard** : statistiques globales avec graphiques (tendance 30 jours, colis/paiements par statut, top routes, revenus par fournisseur), derniers colis, activité récente
- **Utilisateurs** : recherche, changement de rôle, activation/désactivation, **suppression définitive** (garde-fous : pas de suppression de son propre compte)
- **Colis** : recherche par tracking, mise à jour du statut (avec commentaire)
- **Paiements** : liste et filtres par statut
- **Tarifs** : CRUD complet des règles tarifaires
- **Audit** : journal consultable avec détails avant/après

Le proxy Vite (`/api`) redirige vers le backend (port 5000).

---

## Portail client (frontend)

Interface React 19 + Vite + TypeScript + Tailwind dans `frontend-client/` (port **5177**) :

```bash
cd frontend-client
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api/v1
npm run dev
```

**Pages publiques** : accueil (avec simulateur de prix en ligne), tarifs (depuis `/pricing/services`), suivi par numéro de tracking (`/tracking/:code`), services, à propos, contact (WhatsApp), 404.

**Espace client** (inscription / connexion) :
- **Tableau de bord** : statistiques des colis, derniers envois
- **Créer un envoi** : assistant en 4 étapes (itinéraire → contacts → articles/documents → récapitulatif avec devis serveur)
- **Mes colis** : liste, filtres, détail avec chronologie, annulation (si PENDING) et **paiement** (MVola, Orange Money, Airtel, carte → référence à régler via WhatsApp)
- **Suivi**, **paiements**, **documents**, **profil** (coordonnées + mot de passe), **support** (FAQ + WhatsApp)

Données 100 % réelles via l'API (`/api/v1`), aucun mock. Le prix est toujours recalculé côté backend.

---

## Prochaines étapes

1. **PHASE 5** — Webhooks de confirmation de paiement (MVola / Orange / Airtel / carte).
2. **PHASE 7** — Tests (Vitest + Supertest) backend et frontend.
3. **Swagger** — ajouter les endpoints client (pricing, shipments, tracking, payments, documents) à la spec OpenAPI.
4. Upload de documents par le client (liés à un colis).