import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from '../src/modules/auth/auth.routes.js';
import { errorHandler } from '../src/middleware/error.middleware.js';
import { prisma } from '../src/config/prisma.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

beforeAll(async () => {
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.rideRequest.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Auth', () => {
    test('register a new passenger', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Nusrat Jahan',
            email: 'nusrat@test.com',
            password: 'password123',
            role: 'PASSENGER',
        });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.user.role).toBe('PASSENGER');
    });

    test('register a new driver', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Jashim Uddin',
            email: 'jashim@test.com',
            password: 'password123',
            role: 'DRIVER',
        });
        expect(res.status).toBe(201);
        expect(res.body.data.user.role).toBe('DRIVER');
    });

    test('cannot register with duplicate email', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Nusrat Jahan',
            email: 'nusrat@test.com',
            password: 'password123',
            role: 'PASSENGER',
        });
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    test('login with valid credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'nusrat@test.com',
            password: 'password123',
        });
        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
    });

    test('login with invalid password', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'nusrat@test.com',
            password: 'wrongpassword',
        });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('login with non-existent email', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'nobody@test.com',
            password: 'password123',
        });
        expect(res.status).toBe(401);
    });

    test('cannot access /me without token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    test('register with invalid email fails validation', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Test User',
            email: 'not-an-email',
            password: 'password123',
            role: 'PASSENGER',
        });
        expect(res.status).toBe(400);
    });
});