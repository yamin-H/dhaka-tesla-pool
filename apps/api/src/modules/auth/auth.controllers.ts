import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/ApiResponse.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerUser, loginUser, getMe } from './auth.services.js';

//hello
console.log("first")
export const register = asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    sendResponse(res, 201, 'Registration successful', result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    sendResponse(res, 200, 'Login successful', result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const result = await getMe(userId);
    sendResponse(res, 200, 'User fetched', result);
});