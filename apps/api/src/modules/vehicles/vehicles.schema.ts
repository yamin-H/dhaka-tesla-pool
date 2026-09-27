import { z } from 'zod';

export const createVehicleSchema = z.object({
    name: z.string().min(1, 'Vehicle name is required'),
    capacity: z.number().int().min(1).max(10),
});

export const updateVehicleStatusSchema = z.object({
    status: z.enum(['ONLINE', 'OFFLINE']),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleStatusInput = z.infer<typeof updateVehicleStatusSchema>;