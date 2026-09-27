import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import {env} from "../../config/env.js";
import { ApiError } from '../../utils/ApiError.js';
import { RegisterInput, LoginInput } from './auth.schema.js';

export const registerUser = async (input: RegisterInput) => {
    const existing = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existing) {
        throw new ApiError(409, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            password: hashedPassword,
            role: input.role,
        },
    });

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn as any }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

export const loginUser = async (input: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);

    if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn as any }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

export const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return user;
};