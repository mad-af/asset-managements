import { z } from 'zod';

// Create location input validation
export const createLocationSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Name is required'),
	parentId: z.string().nullable().optional(),
	notes: z.string().nullable().optional()
});

// Update location input validation
export const updateLocationSchema = z.object({
	name: z.string().min(1, 'Name is required').optional(),
	parentId: z.string().nullable().optional(),
	notes: z.string().nullable().optional()
});

// Type exports
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;