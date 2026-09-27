import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/ApiResponse.js';
import { createPoolSchema } from './pools.schema.js';
import {createPool,getAvailableRides,markArrived,startRide,completeRide,getMyPools} from './pools.services.js';

export const acceptPool = asyncHandler(async (req: Request, res: Response) => {
    const driverId = (req as any).user.userId;
    const input = createPoolSchema.parse(req.body);
    const result = await createPool(driverId, input);
    sendResponse(res, 201, 'Pool created successfully', result);
});

export const availableRides = asyncHandler(async (req: Request, res: Response) => {
    const driverId = (req as any).user.userId;
    const result = await getAvailableRides(driverId);
    sendResponse(res, 200, 'Available rides fetched', result);
});

export const arrived = asyncHandler(async (req: Request, res: Response) => {
    const driverId = (req as any).user.userId;
    const { id } = req.params;
    const result = await markArrived(id as string, driverId);
    sendResponse(res, 200, 'Marked as arrived', result);
});

export const start = asyncHandler(async (req: Request, res: Response) => {
    const driverId = (req as any).user.userId;
    const { id } = req.params;
    const result = await startRide(id as string, driverId);
    sendResponse(res, 200, 'Ride started', result);
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
    const driverId = (req as any).user.userId;
    const { id } = req.params;
    const result = await completeRide(id as string, driverId);
    sendResponse(res, 200, 'Ride completed', result);
});

export const myPools = asyncHandler(async (req: Request, res: Response) => {
    const driverId = (req as any).user.userId;
    const result = await getMyPools(driverId);
    sendResponse(res, 200, 'Pools fetched', result);
});