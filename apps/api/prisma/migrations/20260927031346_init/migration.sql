-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PASSENGER', 'DRIVER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ONLINE', 'OFFLINE', 'IN_RIDE');

-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentOccupiedSeats" INTEGER NOT NULL DEFAULT 0,
    "status" "VehicleStatus" NOT NULL DEFAULT 'OFFLINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride_requests" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "poolId" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "seatsRequested" INTEGER NOT NULL DEFAULT 1,
    "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
    "estimatedFare" INTEGER NOT NULL,
    "finalFare" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "PoolStatus" NOT NULL DEFAULT 'MATCHED',
    "totalSeatsOccupied" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_members" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "fare" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pool_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_driverId_key" ON "vehicles"("driverId");

-- CreateIndex
CREATE INDEX "ride_requests_passengerId_idx" ON "ride_requests"("passengerId");

-- CreateIndex
CREATE INDEX "ride_requests_status_idx" ON "ride_requests"("status");

-- CreateIndex
CREATE INDEX "ride_requests_poolId_idx" ON "ride_requests"("poolId");

-- CreateIndex
CREATE INDEX "pools_vehicleId_idx" ON "pools"("vehicleId");

-- CreateIndex
CREATE INDEX "pools_status_idx" ON "pools"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pool_members_rideId_key" ON "pool_members"("rideId");

-- CreateIndex
CREATE INDEX "pool_members_poolId_idx" ON "pool_members"("poolId");

-- CreateIndex
CREATE INDEX "pool_members_passengerId_idx" ON "pool_members"("passengerId");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "ride_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
