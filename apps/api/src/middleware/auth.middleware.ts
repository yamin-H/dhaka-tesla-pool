import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new ApiError(401, 'No token provided');
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret);
        (req as any).user = decoded;
        next();
    } catch {
        throw new ApiError(401, 'Invalid or expired token');
    }
};