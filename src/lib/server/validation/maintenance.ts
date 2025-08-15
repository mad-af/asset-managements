import { z } from 'zod';

// Open ticket input validation
export const openTicketSchema = z.object({
	id: z.string().optional(),
	assetId: z.string().min(1, 'Asset ID is required'),
	title: z.string().min(1, 'Title is required'),
	description: z.string().nullable().optional(),
	costCents: z.number().int().min(0).nullable().optional()
});

// Update ticket input validation
export const updateTicketSchema = z.object({
	title: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	costCents: z.number().int().min(0).nullable().optional(),
	status: z.enum(['open', 'in_progress', 'done', 'canceled']).optional()
});

// List tickets parameters validation
export const listTicketsParamsSchema = z.object({
	assetId: z.string().optional(),
	status: z.enum(['open', 'in_progress', 'done', 'canceled']).optional(),
	limit: z.number().min(1).max(1000).optional().default(50),
	offset: z.number().min(0).optional().default(0)
});

// Top assets parameters validation
export const topAssetsByTicketsParamsSchema = z.object({
	limit: z.number().min(1).max(100).optional().default(10)
});

// Total cost range parameters validation
export const totalCostInRangeParamsSchema = z.object({
	startUnix: z.number().int().min(0),
	endUnix: z.number().int().min(0)
}).refine(data => data.endUnix >= data.startUnix, {
	message: 'End time must be greater than or equal to start time'
});

// Type exports
export type OpenTicketInput = z.infer<typeof openTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListTicketsParams = z.infer<typeof listTicketsParamsSchema>;
export type TopAssetsByTicketsParams = z.infer<typeof topAssetsByTicketsParamsSchema>;
export type TotalCostInRangeParams = z.infer<typeof totalCostInRangeParamsSchema>;