# 🛺 Dhaka Tesla Pool

> Share a seat. Split the fare. Survive Dhaka traffic.

A ride-pooling MVP built for the RoBenDevs internship assignment. Jashim drives Bullet (a 3-seat battery-powered Tesla) through Dhaka. Nusrat, Rafiq, and Shirin share rides, split fares, and everyone gets where they're going.

---

## 📋 Problem Statement

Nusrat wants to get from Banani to Mohakhali. Rafiq wants to get from Banani to Gulshan. Jashim's Bullet has three seats. The system needs to match passengers into shared rides, calculate individual fares with pool discounts, enforce seat capacity, and track the full ride lifecycle — all without letting passengers see each other's data.

---

## ✅ Features Implemented

- Passenger registration, login, JWT auth
- Ride request with fare estimation before confirming
- Real-time status tracking: REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
- Driver online/offline toggle
- Pool creation — multiple passengers sharing one Tesla
- Individual fare per passenger with pool discount
- Seat capacity enforcement with DB-level concurrency lock
- Ride cancellation (before STARTED)
- Ride history for passengers and drivers
- Seed data: Jashim, Bullet, Nusrat, Rafiq, Shirin
- Docker Compose setup
- 35 tests covering capacity, state transitions, fare calculations, auth guards

---

## 🏗️ Architecture

Browser (Next.js 14)
↓ HTTP (Axios)
Express.js API (Node.js)
↓ Prisma ORM
PostgreSQL (Neon DB / Docker)


### Key Design Decisions

**Why Express over NestJS?**
Minimal overhead, full control over structure, faster to reason about for an MVP. NestJS adds value at scale with DI and decorators — overkill here.

**Why PostgreSQL over MongoDB?**
Pool capacity enforcement requires ACID transactions and row-level locking. A relational model fits naturally: users, vehicles, ride_requests, pools, pool_members all have clear relationships and constraints.

**Why Prisma over raw SQL or Sequelize?**
Type-safe queries, readable schema, migration system built-in. Reduces bugs from typos in column names.

**Why integer paisa over decimal BDT?**
Floating point arithmetic causes rounding errors on money. `0.1 + 0.2 = 0.30000000004` in JavaScript. Storing as integer paisa (smallest unit) and dividing by 100 only at display time is the standard approach.

---

## 📊 ERD

users
id, name, email, password, role (PASSENGER|DRIVER)

vehicles
id, driverId → users.id, name, capacity, currentOccupiedSeats, status

ride_requests
id, passengerId → users.id, poolId → pools.id
pickupLocation, destination, seatsRequested
status, estimatedFare, finalFare

pools
id, vehicleId → vehicles.id, driverId → users.id
status, totalSeatsOccupied

pool_members
id, poolId → pools.id, passengerId → users.id
rideId → ride_requests.id, fare


---

## 🛠️ Tech Stack

| Layer | Choice | 
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Styling | Tailwind CSS + shadcn/ui |
| Testing | Jest + Supertest |
| Deployment | Render (API) + Vercel (Web) + Neon (DB) |
| Docker | Docker Compose |

---

## 📁 Project Structure

dhaka-tesla-pool/
├── apps/
│ ├── api/ ← Express backend
│ │ ├── prisma/ ← schema, migrations, seed
│ │ ├── src/
│ │ │ ├── config/ ← env, prisma client
│ │ │ ├── middleware/ ← auth, role, error
│ │ │ ├── modules/ ← auth, vehicles, rides, pools, fares
│ │ │ └── utils/ ← ApiError, ApiResponse, asyncHandler
│ │ └── tests/ ← jest + supertest tests
│ └── web/ ← Next.js frontend
│ ├── app/ ← pages (login, register, passenger, driver)
│ ├── components/ ← shadcn/ui components
│ ├── hooks/ ← useAuth
│ ├── lib/ ← api client, auth helpers, utils
│ └── types/ ← shared TypeScript types
├── docker-compose.yml
├── .env.example
└── README.md


---

## ⚙️ Prerequisites

- Node.js v18+
- Docker + Docker Compose
- PostgreSQL (or use Neon free tier)

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` in `apps/api`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your_jwt_secret_here"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="development"
```

Copy `.env.example` to `.env.local` in `apps/web`:

```bash
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

# In a new terminal, install frontend dependencies
cd apps/web
npm install

# Start frontend
npm run dev
```

Backend runs on `http://localhost:4000`
Frontend runs on `http://localhost:3000`

---

## 🐳 Docker Setup

```bash
# Copy env file
cp .env.example .env

# Fill in your DATABASE_URL and JWT_SECRET in .env

# Run everything
docker-compose up --build
```

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

---

## 🧪 Tests

```bash
cd apps/api
npx jest --no-coverage
```

**Test coverage:**
- Fare calculation (Nusrat + Rafiq verified by hand)
- Auth guards (register, login, duplicate email, invalid token)
- Ride lifecycle (request, cancel, ownership check)
- Pool capacity (never exceed 3 seats)
- State transitions (invalid transitions rejected)
- Concurrency (two simultaneous requests can't overbook)

---

## 🔌 API Overview

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

POST /api/rides/request
GET /api/rides/my
GET /api/rides/:id
PATCH /api/rides/:id/cancel

GET /api/fares/estimate
GET /api/fares/zones

POST /api/vehicles
PATCH /api/vehicles/status
GET /api/vehicles/mine

GET /api/pools/available
POST /api/pools/create
PATCH /api/pools/:id/arrived
PATCH /api/pools/:id/start
PATCH /api/pools/:id/complete
GET /api/pools/my


---

## 💰 Fare Model

baseFare = 2000 paisa (৳20)
distanceCharge = distanceKm × 500 paisa/km
poolDiscount = 1000 paisa (৳10) if pooled, else 0
minimumFare = 1000 paisa (৳10)

passengerFare = baseFare + distanceCharge - poolDiscount

Example:
Nusrat (Banani→Mohakhali, 1.7km, pooled):
2000 + (1.7×500) - 1000 = 2000 + 850 - 1000 = 1850 paisa = ৳18.50

Rafiq (Banani→Gulshan, 1.9km, pooled):
2000 + (1.9×500) - 1000 = 2000 + 950 - 1000 = 1950 paisa = ৳19.50


---

## 🔒 Concurrency Handling

**Problem:** Bullet has 1 seat left. Nusrat and Shirin both request it simultaneously.

**Current solution:** PostgreSQL row-level lock inside a transaction:
```sql
SELECT * FROM vehicles WHERE id = $1 FOR UPDATE;
```
One request waits, the other proceeds. If capacity is exceeded, it returns 409.

**At scale (1M passengers):** Use Redis distributed lock + a queue system (BullMQ) so the lock doesn't hold a DB connection.

---

## ⚖️ Key Trade-offs & Known Limitations

- **No real-time push:** Passenger status updates via 5-second polling. At scale, replace with WebSockets or SSE.
- **No real routing:** Zone-based matching with Haversine distance. Real implementation needs Google Maps / OSRM.
- **Render cold start:** Free tier spins down after 15 minutes of inactivity. First request after idle takes ~30 seconds.
- **No payment gateway:** TeslaPay is simulated — fare is calculated and stored but no real transaction occurs.
- **Single driver per vehicle:** MVP assumes 1 driver = 1 vehicle. Multi-vehicle support needs schema changes.

---

## 🚀 Scaling to 1M Passengers

- **Load balancing:** Multiple API instances behind Nginx/AWS ALB
- **DB read replicas:** Separate read/write connections, read from replicas
- **Redis caching:** Cache zone distances, fare calculations
- **Geospatial search:** PostGIS for real location-based matching
- **Queue system:** BullMQ for ride matching, notifications
- **WebSockets:** Replace polling with Socket.io for real-time updates
- **Rate limiting:** Redis-based rate limiter per user
- **Horizontal scaling:** Stateless API (JWT auth) scales horizontally with no changes
- **DB indexing:** Already indexed on `status`, `passengerId`, `poolId`

---

## 🤖 AI Usage

**Tools used:** Claude (Anthropic)

**What for:** Boilerplate setup, utility functions, test structure suggestions

**One accepted suggestion:** Using `FOR UPDATE` SQL lock inside Prisma `$queryRaw` for the concurrency problem — cleaner than application-level locking.

**One rejected suggestion:** Claude suggested using Redis for session management instead of JWT. Rejected because Redis adds infrastructure complexity for an MVP that doesn't need it. JWT is stateless, scales horizontally without extra infra, and is sufficient for this use case.

---

## 🎥 Demo Video

[Link to be added after recording]

---

## 🔗 Deployment

- **Frontend:** [Vercel URL - to be added]
- **Backend:** [Render URL - to be added]