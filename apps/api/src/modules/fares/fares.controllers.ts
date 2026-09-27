import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/ApiResponse.js';
import { getFareBreakdown, getZones } from './fares.services.js';
import { ApiError } from '../../utils/ApiError.js';

export const estimateFare = asyncHandler(async (req: Request, res: Response) => {
    const { pickup, destination, isPooled } = req.query;

    if (!pickup || !destination) {
        throw new ApiError(400, 'pickup and destination are required');
    }

    const result = getFareBreakdown(
        pickup as string,
        destination as string,
        isPooled === 'true'
    );

    sendResponse(res, 200, 'Fare estimated', result);
});

export const listZones = asyncHandler(async (req: Request, res: Response) => {
    const zones = getZones();
    sendResponse(res, 200, 'Zones fetched', zones);
});