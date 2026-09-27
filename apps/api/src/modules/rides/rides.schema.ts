import { z } from 'zod';

export const createRideSchema = z.object({
    pickupLocation: z.string().min(1, 'Pickup location is required'),
    destination: z.string().min(1, 'Destination is required'),
    seatsRequested: z.number().int().min(1).max(3),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;