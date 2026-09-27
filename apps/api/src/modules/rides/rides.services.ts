import {prisma} from "../../config/prisma.js"
import { ApiError } from "../../utils/ApiError.js";
import { calculateEstimatedFare } from "../fares/fares.services.js";
import { CreateRideInput } from "./rides.schema.js";

export const requestRide = async (passengerId: string, input: CreateRideInput) => {
    const activeRide = await prisma.rideRequest.findFirst({
        where: {
            passengerId,
            status: {
                in: ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'],
            },
        },
    });

    if (activeRide) {
        throw new ApiError(409, 'You already have an active ride');
    }

    // Calculate estimated fare
    const estimatedFare = calculateEstimatedFare(
        input.pickupLocation,
        input.destination,
        false
    );

    const ride = await prisma.rideRequest.create({
        data: {
            passengerId,
            pickupLocation: input.pickupLocation,
            destination: input.destination,
            seatsRequested: input.seatsRequested,
            estimatedFare,
        },
    });

    return ride;
};

export const getMyRides = async (passengerId: string) => {
    const rides = await prisma.rideRequest.findMany({
        where: { passengerId },
        orderBy: { createdAt: 'desc' },
    });

    return rides;
};

export const getRideById = async (rideId: string, passengerId: string) => {
    const ride = await prisma.rideRequest.findUnique({
        where: { id: rideId },
    });

    if (!ride) {
        throw new ApiError(404, 'Ride not found');
    }

    if (ride.passengerId !== passengerId) {
        throw new ApiError(403, 'You are not authorized to view this ride');
    }

    return ride;
};

export const cancelRide = async (rideId: string, passengerId: string) => {
    const ride = await prisma.rideRequest.findUnique({
        where: { id: rideId },
    });

    if (!ride) {
        throw new ApiError(404, 'Ride not found');
    }

    if (ride.passengerId !== passengerId) {
        throw new ApiError(403, 'You are not authorized to cancel this ride');
    }

    if (['STARTED', 'COMPLETED', 'CANCELLED'].includes(ride.status)) {
        throw new ApiError(400, `Cannot cancel a ride with status: ${ride.status}`);
    }

    const updated = await prisma.rideRequest.update({
        where: { id: rideId },
        data: { status: 'CANCELLED' },
    });

    return updated;
};