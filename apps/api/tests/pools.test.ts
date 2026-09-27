import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from '../src/modules/auth/auth.routes.js';
import rideRoutes from '../src/modules/rides/rides.routes.js';
import poolRoutes from '../src/modules/pools/pools.routes.js';
import vehicleRoutes from '../src/modules/vehicles/vehicles.routes.js';
import { errorHandler } from '../src/middleware/error.middleware.js';
import { prisma } from '../src/config/prisma.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use(errorHandler);

let driverToken: string;
let nusratToken: string;
let rafiqToken: string;
let shirinToken: string;
let nusratRideId: string;
let rafiqRideId: string;
let shirinRideId: string;
let poolId: string;

beforeAll(async () => {
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.rideRequest.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    // Register all users
    const driverRes = await request(app).post('/api/auth/register').send({
        name: 'Jashim Uddin',
        email: 'jashim@test.com',
        password: 'password123',
        role: 'DRIVER',
    });
    driverToken = driverRes.body.data.token;

    const nusratRes = await request(app).post('/api/auth/register').send({
        name: 'Nusrat Jahan',
        email: 'nusrat@test.com',
        password: 'password123',
        role: 'PASSENGER',
    });
    nusratToken = nusratRes.body.data.token;

    const rafiqRes = await request(app).post('/api/auth/register').send({
        name: 'Rafiq Islam',
        email: 'rafiq@test.com',
        password: 'password123',
        role: 'PASSENGER',
    });
    rafiqToken = rafiqRes.body.data.token;

    const shirinRes = await request(app).post('/api/auth/register').send({
        name: 'Shirin Akter',
        email: 'shirin@test.com',
        password: 'password123',
        role: 'PASSENGER',
    });
    shirinToken = shirinRes.body.data.token;

    // Register Bullet with capacity 3
    await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ name: 'Bullet', capacity: 3 });

    // Go online
    await request(app)
        .patch('/api/vehicles/status')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: 'ONLINE' });

    // All passengers request rides
    const nusratRide = await request(app)
        .post('/api/rides/request')
        .set('Authorization', `Bearer ${nusratToken}`)
        .send({ pickupLocation: 'Banani', destination: 'Mohakhali', seatsRequested: 1 });
    nusratRideId = nusratRide.body.data.id;

    const rafiqRide = await request(app)
        .post('/api/rides/request')
        .set('Authorization', `Bearer ${rafiqToken}`)
        .send({ pickupLocation: 'Banani', destination: 'Gulshan', seatsRequested: 1 });
    rafiqRideId = rafiqRide.body.data.id;

    const shirinRide = await request(app)
        .post('/api/rides/request')
        .set('Authorization', `Bearer ${shirinToken}`)
        .send({ pickupLocation: 'Banani', destination: 'Dhanmondi', seatsRequested: 1 });
    shirinRideId = shirinRide.body.data.id;
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Pool Capacity & Lifecycle', () => {
    test('driver can see all available rides', async () => {
        const res = await request(app)
            .get('/api/pools/available')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(3);
    });

    test('driver can pool Nusrat and Rafiq together', async () => {
        const res = await request(app)
            .post('/api/pools/create')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ rideRequestIds: [nusratRideId, rafiqRideId] });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        poolId = res.body.data.id;
    });

    test('Bullet seats are updated after pool creation', async () => {
        const vehicle = await prisma.vehicle.findFirst({
            where: { name: 'Bullet' },
        });
        expect(vehicle?.currentOccupiedSeats).toBe(2);
    });

    test('Nusrat ride status is MATCHED after pool creation', async () => {
        const ride = await prisma.rideRequest.findUnique({
            where: { id: nusratRideId },
        });
        expect(ride?.status).toBe('MATCHED');
        expect(ride?.poolId).toBe(poolId);
    });

    test('Rafiq gets pool discount on fare', async () => {
        const member = await prisma.poolMember.findFirst({
            where: { passengerId: (await prisma.user.findFirst({ where: { email: 'rafiq@test.com' } }))?.id as string },
        });
        expect(member?.fare).toBeLessThan(2950);
    });

    test('cannot exceed Bullet capacity of 3 seats', async () => {
        // Try to add Shirin to a new pool — only 1 seat left but Bullet is IN_RIDE
        const res = await request(app)
            .post('/api/pools/create')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ rideRequestIds: [shirinRideId] });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('pool lifecycle: arrived → started → completed', async () => {
        const arrivedRes = await request(app)
            .patch(`/api/pools/${poolId}/arrived`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(arrivedRes.status).toBe(200);
        expect(arrivedRes.body.data.status).toBe('DRIVER_ARRIVED');

        const startRes = await request(app)
            .patch(`/api/pools/${poolId}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(startRes.status).toBe(200);
        expect(startRes.body.data.status).toBe('STARTED');

        const completeRes = await request(app)
            .patch(`/api/pools/${poolId}/complete`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(completeRes.status).toBe(200);
        expect(completeRes.body.data.status).toBe('COMPLETED');
    });

    test('Bullet seats reset to 0 after completion', async () => {
        const vehicle = await prisma.vehicle.findFirst({
            where: { name: 'Bullet' },
        });
        expect(vehicle?.currentOccupiedSeats).toBe(0);
        expect(vehicle?.status).toBe('ONLINE');
    });

    test('Nusrat final fare is set after completion', async () => {
        const ride = await prisma.rideRequest.findUnique({
            where: { id: nusratRideId },
        });
        expect(ride?.status).toBe('COMPLETED');
        expect(ride?.finalFare).not.toBeNull();
    });

    test('invalid state transition is rejected', async () => {
        // Try to start an already completed pool
        const res = await request(app)
            .patch(`/api/pools/${poolId}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(400);
    });

    test('concurrency: two requests cannot overbook seats', async () => {
        // Reset vehicle and create new rides
        await prisma.vehicle.updateMany({
            where: { name: 'Bullet' },
            data: { currentOccupiedSeats: 2, status: 'ONLINE' },
        });

        // Create two new passengers
        const p1Res = await request(app).post('/api/auth/register').send({
            name: 'Passenger One',
            email: 'p1@test.com',
            password: 'password123',
            role: 'PASSENGER',
        });
        const p2Res = await request(app).post('/api/auth/register').send({
            name: 'Passenger Two',
            email: 'p2@test.com',
            password: 'password123',
            role: 'PASSENGER',
        });

        const ride1 = await request(app)
            .post('/api/rides/request')
            .set('Authorization', `Bearer ${p1Res.body.data.token}`)
            .send({ pickupLocation: 'Banani', destination: 'Mohakhali', seatsRequested: 1 });

        const ride2 = await request(app)
            .post('/api/rides/request')
            .set('Authorization', `Bearer ${p2Res.body.data.token}`)
            .send({ pickupLocation: 'Banani', destination: 'Gulshan', seatsRequested: 1 });

        // Fire both pool creation requests simultaneously
        const [res1, res2] = await Promise.all([
            request(app)
                .post('/api/pools/create')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ rideRequestIds: [ride1.body.data.id] }),
            request(app)
                .post('/api/pools/create')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ rideRequestIds: [ride2.body.data.id] }),
        ]);

        // Only one should succeed
        const successCount = [res1, res2].filter((r) => r.status === 201).length;
        const failCount = [res1, res2].filter((r) => r.status !== 201).length;
        expect(successCount).toBe(1);
        expect(failCount).toBe(1);
    });
});