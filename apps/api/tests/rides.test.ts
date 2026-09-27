import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from '../src/modules/auth/auth.routes.js';
import rideRoutes from '../src/modules/rides/rides.routes.js';
import { errorHandler } from '../src/middleware/error.middleware.js';
import { prisma } from '../src/config/prisma.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use(errorHandler);

let passengerToken: string;
let driverToken: string;
let rideId: string;

beforeAll(async () => {
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.rideRequest.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    const passengerRes = await request(app).post('/api/auth/register').send({
        name: 'Nusrat Jahan',
        email: 'nusrat@test.com',
        password: 'password123',
        role: 'PASSENGER',
    });
    passengerToken = passengerRes.body.data.token;

    const driverRes = await request(app).post('/api/auth/register').send({
        name: 'Jashim Uddin',
        email: 'jashim@test.com',
        password: 'password123',
        role: 'DRIVER',
    });
    driverToken = driverRes.body.data.token;
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Rides', () => {
    test('passenger can request a ride', async () => {
        const res = await request(app)
            .post('/api/rides/request')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({
                pickupLocation: 'Banani',
                destination: 'Mohakhali',
                seatsRequested: 1,
            });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe('REQUESTED');
        expect(res.body.data.estimatedFare).toBe(2850);
        rideId = res.body.data.id;
    });

    test('passenger cannot request another ride while active', async () => {
        const res = await request(app)
            .post('/api/rides/request')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({
                pickupLocation: 'Banani',
                destination: 'Gulshan',
                seatsRequested: 1,
            });
        expect(res.status).toBe(409);
    });

    test('driver cannot request a ride', async () => {
        const res = await request(app)
            .post('/api/rides/request')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({
                pickupLocation: 'Banani',
                destination: 'Mohakhali',
                seatsRequested: 1,
            });
        expect(res.status).toBe(403);
    });

    test('passenger can view their own ride', async () => {
        const res = await request(app)
            .get(`/api/rides/${rideId}`)
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(rideId);
    });

    test('passenger cannot view another passengers ride', async () => {
        const otherRes = await request(app).post('/api/auth/register').send({
            name: 'Rafiq Islam',
            email: 'rafiq@test.com',
            password: 'password123',
            role: 'PASSENGER',
        });
        const otherToken = otherRes.body.data.token;

        const res = await request(app)
            .get(`/api/rides/${rideId}`)
            .set('Authorization', `Bearer ${otherToken}`);
        expect(res.status).toBe(403);
    });

    test('passenger can cancel a requested ride', async () => {
        const res = await request(app)
            .patch(`/api/rides/${rideId}/cancel`)
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('CANCELLED');
    });

    test('passenger cannot cancel an already cancelled ride', async () => {
        const res = await request(app)
            .patch(`/api/rides/${rideId}/cancel`)
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(400);
    });

    test('unauthenticated request is rejected', async () => {
        const res = await request(app).get('/api/rides/my');
        expect(res.status).toBe(401);
    });
});