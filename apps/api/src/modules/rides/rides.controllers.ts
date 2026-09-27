import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/ApiResponse.js';
import { createRideSchema } from './rides.schema.js';
import { requestRide, getMyRides, getRideById, cancelRide } from './rides.services.js';

export const createRide = asyncHandler(async (req: Request, res: Response) => {
    const passengerId = (req as any).user.userId;
    const input = createRideSchema.parse(req.body);
    const result = await requestRide(passengerId, input);
    sendResponse(res, 201, 'Ride requested successfully', result);
});

export const myRides = asyncHandler(async (req: Request, res: Response) => {
    const passengerId = (req as any).user.userId;
    const result = await getMyRides(passengerId);
    sendResponse(res, 200, 'Rides fetched', result);
});

export const rideById = asyncHandler(async (req: Request, res: Response) => {
    const passengerId = (req as any).user.userId;
    const { id } = req.params;
    const result = await getRideById(id as string, passengerId);
    sendResponse(res, 200, 'Ride fetched', result);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
    const passengerId = (req as any).user.userId;
    const { id } = req.params;
    const result = await cancelRide(id as string, passengerId);
    sendResponse(res, 200, 'Ride cancelled', result);
});