import { z } from 'zod';

export const createPoolSchema = z.object({
    rideRequestIds: z
        .array(z.string().uuid())
        .min(1, 'At least one ride request is required')
        .max(3, 'Cannot exceed vehicle capacity'),
});

export type CreatePoolInput = z.infer<typeof createPoolSchema>;