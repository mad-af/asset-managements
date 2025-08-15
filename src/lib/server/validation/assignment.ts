import { z } from 'zod';

// Checkout assignment input validation
export const checkoutSchema = z.object({
	id: z.string().optional(),
	assetId: z.string().min(1, 'Asset ID is required'),
	userId: z.string().min(1, 'User ID is required'),
	dueAt: z.number().nullable().optional(),
	conditionOut: z.string().nullable().optional(),
	notes: z.string().nullable().optional()
});

// Return assignment input validation
export const returnAssignmentSchema = z.object({
	conditionIn: z.string().nullable().optional(),
	notes: z.string().nullable().optional()
});

// List assignments parameters validation
export const listAssignmentsParamsSchema = z.object({
	userId: z.string().optional(),
	assetId: z.string().optional(),
	returned: z.boolean().optional(),
	limit: z.number().min(1).max(1000).optional().default(50),
	offset: z.number().min(0).optional().default(0)
});

// List outstanding parameters validation
export const listOutstandingParamsSchema = z.object({
	userId: z.string().optional(),
	limit: z.number().min(1).max(1000).optional().default(50),
	offset: z.number().min(0).optional().default(0)
});

// Type exports
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReturnAssignmentInput = z.infer<typeof returnAssignmentSchema>;
export type ListAssignmentsParams = z.infer<typeof listAssignmentsParamsSchema>;
export type ListOutstandingParams = z.infer<typeof listOutstandingParamsSchema>;