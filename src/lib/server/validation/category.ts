import { z } from 'zod';

// Create category input validation
export const createCategorySchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Name is required'),
	description: z.string().nullable().optional()
});

// Update category input validation
export const updateCategorySchema = z.object({
	name: z.string().min(1, 'Name is required').optional(),
	description: z.string().nullable().optional()
});

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;