import {prisma} from "../../config/prisma.js"
import { ApiError } from "../../utils/ApiError.js";
import { CreateVehicleInput, UpdateVehicleStatusInput } from "./vehicles.schema.js";

export const createVehicle = async (driverId: string, input: CreateVehicleInput) => {
    const existing = await prisma.vehicle.findUnique({
        where: { driverId },
    });

    if (existing) {
        throw new ApiError(409, 'Driver already has a vehicle registered');
    }

    const vehicle = await prisma.vehicle.create({
        data: {
            driverId,
            name: input.name,
            capacity: input.capacity,
        },
    });

    return vehicle;
};

export const updateVehicleStatus = async (driverId: string, input: UpdateVehicleStatusInput) => {
    const vehicle = await prisma.vehicle.findUnique({
        where: { driverId },
    });

    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    if (vehicle.status === 'IN_RIDE') {
        throw new ApiError(400, 'Cannot change status while in a ride');
    }

    const updated = await prisma.vehicle.update({
        where: { driverId },
        data: { status: input.status },
    });

    return updated;
};

export const getMyVehicle = async (driverId: string) => {
    const vehicle = await prisma.vehicle.findUnique({
        where: { driverId },
    });

    if (!vehicle) {
        throw new ApiError(404, 'No vehicle found for this driver');
    }

    return vehicle;
};