import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/ApiResponse.js';
import { createVehicleSchema, updateVehicleStatusSchema } from './vehicles.schema.js';
import { createVehicle, updateVehicleStatus, getMyVehicle } from './vehicles.services.js';

export const registerVehicle = asyncHandler(async (req: Request, res: Response) => {
    const driverId = (req as any).user.userId;
    const input = createVehicleSchema.parse(req.body);
    const result = await createVehicle(driverId, input);
    sendResponse(res, 201, 'Vehicle registered successfully', result);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const driverId = (req as any).user.userId;
    const input = updateVehicleStatusSchema.parse(req.body);
    const result = await updateVehicleStatus(driverId, input);
    sendResponse(res, 200, 'Vehicle status updated', result);
});

export const getVehicle = asyncHandler(async (req: Request, res: Response) => {
    const driverId = (req as any).user.userId;
    const result = await getMyVehicle(driverId);
    sendResponse(res, 200, 'Vehicle fetched', result);
});