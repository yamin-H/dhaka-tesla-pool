import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export const requireRole = (role: 'PASSENGER' | 'DRIVER') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            throw new ApiError(401, 'Unauthorized');
        }

        if (user.role !== role) {
            throw new ApiError(403, `Access denied. ${role} role required`);
        }

        next();
    };
};