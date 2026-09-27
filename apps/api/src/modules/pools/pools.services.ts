import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { calculateEstimatedFare } from '../fares/fares.services.js';
import { CreatePoolInput } from './pools.schema.js';

export const createPool = async (driverId: string, input: CreatePoolInput) => {
    // Get driver's vehicle
    const vehicle = await prisma.vehicle.findUnique({
        where: { driverId },
    });

    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    if (vehicle.status !== 'ONLINE') {
        throw new ApiError(400, 'Vehicle must be online to accept rides');
    }

    const rideRequests = await prisma.rideRequest.findMany({
        where: {
            id: { in: input.rideRequestIds },
            status: 'REQUESTED',
        },
    });

    if (rideRequests.length !== input.rideRequestIds.length) {
        throw new ApiError(400, 'One or more ride requests are invalid or no longer available');
    }

    // Calculate total seats needed
    const totalSeatsNeeded = rideRequests.reduce(
        (sum, ride) => sum + ride.seatsRequested,
        0
    );

    // Use a transaction with row-level lock to prevent overbooking
    const pool = await prisma.$transaction(async (tx) => {
        // Lock the vehicle row to prevent concurrent bookings
        const lockedVehicle = await tx.$queryRaw<any[]>`
      SELECT * FROM vehicles WHERE id = ${vehicle.id} FOR UPDATE
    `;

        const currentVehicle = lockedVehicle[0];
        const availableSeats =
            currentVehicle.capacity - currentVehicle.current_occupied_seats;

        if (totalSeatsNeeded > availableSeats) {
            throw new ApiError(
                409,
                `Not enough seats. Available: ${availableSeats}, Requested: ${totalSeatsNeeded}`
            );
        }

        // Create the pool
        const newPool = await tx.pool.create({
            data: {
                vehicleId: vehicle.id,
                driverId,
                totalSeatsOccupied: totalSeatsNeeded,
            },
        });

        // Update each ride request and create pool members
        for (const ride of rideRequests) {
            const fare = calculateEstimatedFare(
                ride.pickupLocation,
                ride.destination,
                rideRequests.length > 1
            );

            await tx.rideRequest.update({
                where: { id: ride.id },
                data: {
                    status: 'MATCHED',
                    poolId: newPool.id,
                    estimatedFare: fare,
                },
            });

            await tx.poolMember.create({
                data: {
                    poolId: newPool.id,
                    passengerId: ride.passengerId,
                    rideId: ride.id,
                    fare,
                },
            });
        }

        // Update vehicle occupied seats
        await tx.vehicle.update({
            where: { id: vehicle.id },
            data: {
                currentOccupiedSeats: {
                    increment: totalSeatsNeeded,
                },
                status: 'IN_RIDE',
            },
        });

        return newPool;
    });

    return pool;
};

export const getAvailableRides = async (driverId: string) => {
    const vehicle = await prisma.vehicle.findUnique({
        where: { driverId },
    });

    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    const availableSeats = vehicle.capacity - vehicle.currentOccupiedSeats;

    const rides = await prisma.rideRequest.findMany({
        where: {
            status: 'REQUESTED',
            seatsRequested: { lte: availableSeats },
        },
        include: {
            passenger: {
                select: { id: true, name: true, email: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    return rides;
};

export const markArrived = async (poolId: string, driverId: string) => {
    const pool = await prisma.pool.findUnique({
        where: { id: poolId },
    });

    if (!pool) {
        throw new ApiError(404, 'Pool not found');
    }

    if (pool.driverId !== driverId) {
        throw new ApiError(403, 'You are not authorized to update this pool');
    }

    if (pool.status !== 'MATCHED') {
        throw new ApiError(400, `Cannot mark arrived from status: ${pool.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        const updatedPool = await tx.pool.update({
            where: { id: poolId },
            data: { status: 'DRIVER_ARRIVED' },
        });

        await tx.rideRequest.updateMany({
            where: { poolId },
            data: { status: 'DRIVER_ARRIVED' },
        });

        return updatedPool;
    });

    return updated;
};

export const startRide = async (poolId: string, driverId: string) => {
    const pool = await prisma.pool.findUnique({
        where: { id: poolId },
    });

    if (!pool) {
        throw new ApiError(404, 'Pool not found');
    }

    if (pool.driverId !== driverId) {
        throw new ApiError(403, 'You are not authorized to update this pool');
    }

    if (pool.status !== 'DRIVER_ARRIVED') {
        throw new ApiError(400, `Cannot start ride from status: ${pool.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        const updatedPool = await tx.pool.update({
            where: { id: poolId },
            data: { status: 'STARTED' },
        });

        await tx.rideRequest.updateMany({
            where: { poolId },
            data: { status: 'STARTED' },
        });

        return updatedPool;
    });

    return updated;
};

export const completeRide = async (poolId: string, driverId: string) => {
    const pool = await prisma.pool.findUnique({
        where: { id: poolId },
        include: { rideRequests: true },
    });

    if (!pool) {
        throw new ApiError(404, 'Pool not found');
    }

    if (pool.driverId !== driverId) {
        throw new ApiError(403, 'You are not authorized to update this pool');
    }

    if (pool.status !== 'STARTED') {
        throw new ApiError(400, `Cannot complete ride from status: ${pool.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        const updatedPool = await tx.pool.update({
            where: { id: poolId },
            data: { status: 'COMPLETED' },
        });

        // Set final fare from pool members and complete ride requests
        const poolMembers = await tx.poolMember.findMany({
            where: { poolId },
        });

        for (const member of poolMembers) {
            await tx.rideRequest.update({
                where: { id: member.rideId },
                data: {
                    status: 'COMPLETED',
                    finalFare: member.fare,
                },
            });
        }

        // Free up vehicle seats
        await tx.vehicle.update({
            where: { id: pool.vehicleId },
            data: {
                currentOccupiedSeats: 0,
                status: 'ONLINE',
            },
        });

        return updatedPool;
    });

    return updated;
};

export const getMyPools = async (driverId: string) => {
    const pools = await prisma.pool.findMany({
        where: { driverId },
        include: {
            rideRequests: {
                include: {
                    passenger: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
            poolMembers: true,
            vehicle: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return pools;
};