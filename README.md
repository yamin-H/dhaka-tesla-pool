# 🛺 Dhaka Tesla Pool

> Share a seat. Split the fare. Survive Dhaka traffic.

A ride-pooling MVP built for the RoBenDevs internship assignment. Jashim drives Bullet (a 3-seat battery-powered Tesla) through Dhaka. Nusrat, Rafiq, and Shirin share rides, split fares, and everyone gets where they're going.

---

## 📋 Problem Statement

Nusrat wants to get from Banani to Mohakhali. Rafiq wants to get from Banani to Gulshan. Jashim's Bullet has three seats. The system needs to match passengers into shared rides, calculate individual fares with pool discounts, enforce seat capacity, and track the full ride lifecycle — all without letting passengers see each other's data.

---

## ✅ Features Implemented

- Passenger registration, login, JWT auth
- Driver registration with online/offline toggle
- Ride request with fare estimation before confirming
- Ride lifecycle: REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
- Cancellation allowed only before ride STARTED
- Driver sees available rides, creates pool
- Pool creation — multiple passengers sharing one Tesla
- Individual fare per passenger with pool discount
- Seat capacity enforcement (3 seats) with DB-level concurrency lock
- Ride history for both passengers and drivers
- Seed data: Jashim, Bullet, Nusrat, Rafiq, Shirin
- Docker Compose cold start
- 35 tests covering capacity, state transitions, fare calculations, user isolation, cancellation

---

## 🏗️ Architecture

![Dhaka Tesla Pool Architecture](./docs/dhaka-pool-architecture-design.png)

### Key Design Decisions

**Why Express over NestJS?**
Minimal overhead, full control over structure, faster to reason about for an MVP. NestJS adds value at scale with DI and decorators — overkill here.

**Why PostgreSQL over MongoDB?**
Pool capacity enforcement requires ACID transactions and row-level locking (`SELECT ... FOR UPDATE`). A relational model fits naturally: users, vehicles, ride_requests, pools, pool_members all have clear relationships and constraints.

**Why Prisma over raw SQL or Sequelize?**
Type-safe queries, readable schema, migration system built-in. Reduces bugs from typos in column names. Still allows raw SQL via `$queryRaw` when needed (used for `FOR UPDATE` lock).

**Why integer paisa over decimal BDT?**
Floating point arithmetic causes rounding errors on money. `0.1 + 0.2 = 0.30000000004` in JavaScript. Storing as integer paisa (smallest unit) and dividing by 100 only at display time is the standard approach.

**Why JWT over session-based auth?**
Stateless authentication scales horizontally without shared session storage. No Redis dependency for an MVP.

---

## 📊 ERD

```mermaid
erDiagram
    users {
        string id PK
        string name
        string email UK
        string password
        enum role "PASSENGER | DRIVER"
        datetime createdAt
    }

    vehicles {
        string id PK
        string driverId FK
        string name
        int capacity
        int currentOccupiedSeats
        enum status "ONLINE | OFFLINE | ON_RIDE"
    }

    ride_requests {
        string id PK
        string passengerId FK
        string poolId FK
        string pickupLocation
        string destination
        int seatsRequested
        enum status "REQUESTED | MATCHED | DRIVER_ARRIVED | STARTED | COMPLETED | CANCELLED"
        int estimatedFare
        int finalFare
    }

    pools {
        string id PK
        string vehicleId FK
        string driverId FK
        enum status "ACTIVE | COMPLETED | CANCELLED"
        int totalSeatsOccupied
    }

    pool_members {
        string id PK
        string poolId FK
        string passengerId FK
        string rideId FK
        int fare
    }

    users ||--o| vehicles : "drives"
    users ||--o{ ride_requests : "requests"
    users ||--o{ pools : "drives"
    vehicles ||--o{ pools : "assigned to"
    pools ||--o{ pool_members : "has"
    pools ||--o{ ride_requests : "contains"
    users ||--o{ pool_members : "member of"
    ride_requests ||--o| pool_members : "linked to"
```

---

## 🛠️ Tech Stack

| Layer | Choice | Justification |
|---|---|---|
| Frontend | Next.js 16 (App Router) | Server components, file-based routing, React 19 support |
| Backend | Node.js + Express.js | Lightweight, full control, fast MVP iteration |
| Database | PostgreSQL (Neon) | ACID transactions, row-level locks for capacity |
| ORM | Prisma | Type-safe queries, migrations, raw SQL when needed |
| Auth | JWT + bcrypt | Stateless, no Redis dependency |
| Validation | Zod | Runtime schema validation with TypeScript inference |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, accessible component primitives |
| Testing | Jest + Supertest | Integration tests against real DB |
| Container | Docker Compose | API + PostgreSQL cold start |

---

## 📁 Project Structure

```
dhaka-tesla-pool/
├── apps/
│   ├── api/                    ← Express backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   ← DB schema
│   │   │   ├── migrations/     ← SQL migrations
│   │   │   └── seed.ts         ← Jashim, Bullet, Nusrat, Rafiq, Shirin
│   │   ├── src/
│   │   │   ├── config/         ← env, prisma client
│   │   │   ├── middleware/     ← authenticate, requireRole, errorHandler
│   │   │   └── modules/
│   │   │       ├── auth/       ← register, login, me
│   │   │       ├── vehicles/   ← register, toggle status, mine
│   │   │       ├── fares/      ← estimate, zones
│   │   │       ├── rides/      ← request, cancel, my, view
│   │   │       └── pools/      ← create, arrived, start, complete, my
│   │   └── tests/              ← 35 integration tests
│   └── web/                    ← Next.js frontend
│       ├── app/                ← pages (login, register, dashboards)
│       ├── components/         ← UI components
│       ├── hooks/              ← useAuth
│       ├── lib/                ← API client, utils
│       └── types/              ← shared TypeScript types
├── docs/                       ← architecture diagram
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚙️ Prerequisites

- Node.js v18+
- Docker + Docker Compose
- PostgreSQL (or use Neon free tier)

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` in `apps/api`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your_jwt_secret_here"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="development"
```

Copy `.env.example` to `.env.local` in `apps/web`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 🚀 Local Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/dhaka-tesla-pool.git
cd dhaka-tesla-pool

# Install backend dependencies
cd apps/api
npm install

# Run migrations
npx prisma migrate dev

# Seed database
npm run db:seed

# Start backend
npm run dev

# In a new terminal — install and start frontend
cd apps/web
npm install
npm run dev
```

Backend: `http://localhost:4000`
Frontend: `http://localhost:3000`

---

## 🐳 Docker Setup

```bash
# From project root
cp .env.example .env

# Run everything (cold start — boots API + PostgreSQL, runs migrations and seeds automatically)
docker compose up --build
```

API will be available at `http://localhost:4000`.

---

## 🌱 Seed Data

```bash
cd apps/api
npm run db:seed
```

Demo credentials (all passwords: `password123`):

| Name | Email | Role |
|---|---|---|
| Jashim Uddin | jashim@example.com | DRIVER |
| Nusrat Jahan | nusrat@example.com | PASSENGER |
| Rafiq Islam | rafiq@example.com | PASSENGER |
| Shirin Akter | shirin@example.com | PASSENGER |

Jashim's vehicle **Bullet** is registered with **3 seats**.

---

## 💰 Fare Model

All fares stored as **integer paisa** (smallest currency unit) to avoid floating-point rounding errors. Divided by 100 only at display time.

```
baseFare       = 2000 paisa (৳20)
distanceCharge = distanceKm × 500 paisa/km
poolDiscount   = 1000 paisa (৳10) if pooled, else 0
minimumFare    = 1000 paisa (৳10)

passengerFare  = baseFare + distanceCharge - poolDiscount
```

### Hand-verified examples:

**Nusrat** (Banani → Mohakhali, 1.7km, pooled):
```
2000 + (1.7 × 500) - 1000 = 2000 + 850 - 1000 = 1850 paisa = ৳18.50
```

**Rafiq** (Banani → Gulshan, 1.9km, pooled):
```
2000 + (1.9 × 500) - 1000 = 2000 + 950 - 1000 = 1950 paisa = ৳19.50
```

Nusrat sees ৳18.50. Rafiq sees ৳19.50. Neither sees the other's fare.

---

## 🔒 Concurrency Handling

**Problem:** Bullet has 1 seat left. Nusrat and Shirin both request it simultaneously.

**Solution:** PostgreSQL row-level lock inside a Prisma transaction:

```sql
BEGIN;
SELECT * FROM vehicles WHERE id = $1 FOR UPDATE;
-- One request acquires the lock, the other waits
-- If capacity exceeded after lock acquired → 409 Conflict
COMMIT;
```

One request proceeds, the other waits for the lock. If capacity is exceeded after acquiring the lock, it returns `409 Conflict`. This guarantees Bullet's 3 seats are never overbooked, even under concurrent load.

**At scale (1M passengers):** Add Redis distributed lock + BullMQ queue so the lock doesn't hold a DB connection.

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register passenger or driver |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (requires auth) |

### Rides (Passenger)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rides/request` | Request a ride with fare estimate |
| GET | `/api/rides/my` | View own ride history |
| GET | `/api/rides/:id` | View specific ride (own only) |
| PATCH | `/api/rides/:id/cancel` | Cancel ride (before STARTED) |

### Fares
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/fares/estimate` | Get fare estimate for a route |
| GET | `/api/fares/zones` | List all available Dhaka zones |

### Vehicles (Driver)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/vehicles` | Register a vehicle |
| PATCH | `/api/vehicles/status` | Toggle online/offline |
| GET | `/api/vehicles/mine` | Get own vehicle |

### Pools (Driver)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pools/available` | See available ride requests |
| POST | `/api/pools/create` | Create pool from ride requests |
| PATCH | `/api/pools/:id/arrived` | Mark DRIVER_ARRIVED |
| PATCH | `/api/pools/:id/start` | Mark STARTED |
| PATCH | `/api/pools/:id/complete` | Mark COMPLETED |
| GET | `/api/pools/my` | View own pool history |

---

## 🧪 Tests

```bash
cd apps/api
npm test
```

**35 tests** across 4 test files:

| Category | Tests | What's covered |
|---|---|---|
| Auth (8) | Register, login, duplicate email, invalid credentials, token guard | Auth guards work correctly |
| Fares (8) | Nusrat + Rafiq solo/pooled fares, min fare, invalid zone, structure | Fare formula matches hand calculations |
| Rides (8) | Request, cancel, ownership, role guard, duplicate active ride | Passengers can't see each other's rides |
| Pools (11) | Capacity limit, lifecycle, seat update/reset, concurrency, state transitions | Two simultaneous requests can't overbook |

### Required test categories covered:
- ✅ **Capacity enforcement** — `cannot exceed Bullet capacity of 3 seats` + concurrency test
- ✅ **Invalid state transitions** — `invalid state transition is rejected` (start on completed pool)
- ✅ **Fare calculation** — Nusrat/Rafiq verified against hand math
- ✅ **User isolation** — `passenger cannot view another passenger's ride` (returns 403)
- ✅ **Cancellation rules** — `can cancel requested`, `cannot cancel already cancelled`

---

## ⚖️ Key Trade-offs & Known Limitations

- **No real-time push:** Passenger polls for status updates. At scale, replace with WebSockets or SSE.
- **No real routing:** Zone-based matching with Haversine distance formula. Real implementation needs Google Maps / OSRM.
- **No payment gateway:** Fare is calculated and stored but no real transaction occurs. TeslaPay is simulated.
- **Single driver per vehicle:** MVP assumes 1 driver = 1 vehicle.
- **Hardcoded zones:** 8 Dhaka areas (Banani, Gulshan, Mohakhali, Dhanmondi, Uttara, Mirpur, Motijheel, Farmgate) with fixed lat/lng coordinates.

---

## 🚀 Scaling to 1M Passengers

- **Load balancing:** Multiple API instances behind Nginx/AWS ALB (JWT is stateless — scales horizontally)
- **DB read replicas:** Separate read/write connections
- **Redis caching:** Cache zone distances, fare calculations
- **Geospatial search:** PostGIS for real location-based matching
- **Queue system:** BullMQ for async ride matching and notifications
- **WebSockets:** Replace polling with Socket.io for real-time updates
- **Rate limiting:** Redis-based rate limiter per user
- **DB indexing:** Already indexed on `status`, `passengerId`, `poolId`

---

## 🤖 AI Usage

**Tools used:** Claude (Anthropic)

**What for:** Boilerplate setup, utility functions, test structure suggestions

**One accepted suggestion:** Using `FOR UPDATE` SQL lock inside Prisma `$queryRaw` for the concurrency problem — cleaner than application-level locking. I understood the tradeoff (holds DB connection during lock) and accepted it because for an MVP with low concurrency, it's the simplest correct solution.

**One rejected suggestion:** Claude suggested using Redis for session management instead of JWT. Rejected because Redis adds infrastructure complexity for an MVP that doesn't need it. JWT is stateless, scales horizontally without extra infra, and is sufficient for this use case.

---

## 🎥 Demo Video

[Link to be added after recording]

---

## 🔗 Deployment

- **Frontend:** [https://dhaka-tesla-pool-nu.vercel.app](https://dhaka-tesla-pool-nu.vercel.app)
- **Backend:** [https://dhaka-tesla-pool-wxns.onrender.com](https://dhaka-tesla-pool-wxns.onrender.com)