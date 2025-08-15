import { z } from 'zod';

// Create audit input validation
export const createAuditSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, 'Title is required'),
	locationId: z.string().nullable().optional(),
	notes: z.string().nullable().optional()
});

// Seed audit items input validation
export const seedAuditItemsSchema = z.object({
	auditId: z.string().min(1, 'Audit ID is required'),
	locationId: z.string().min(1, 'Location ID is required')
});

// Scan asset input validation
export const scanAssetSchema = z.object({
	auditId: z.string().min(1, 'Audit ID is required'),
	assetCodeOrId: z.string().min(1, 'Asset code or ID is required'),
	payload: z.object({
		foundLocationId: z.string().nullable().optional(),
		condition: z.string().nullable().optional(),
		notes: z.string().nullable().optional()
	}).optional()
});

// List audits parameters validation
export const listAuditsParamsSchema = z.object({
	status: z.enum(['draft', 'in_progress', 'finalized']).optional()
});

// Audit status validation for transitions
export const auditStatusTransitionSchema = z.object({
	currentStatus: z.enum(['draft', 'in_progress', 'finalized']),
	newStatus: z.enum(['draft', 'in_progress', 'finalized'])
}).refine(data => {
	// Valid transitions:
	// draft -> in_progress
	// in_progress -> finalized
	// (no backwards transitions allowed)
	if (data.currentStatus === 'draft' && data.newStatus === 'in_progress') return true;
	if (data.currentStatus === 'in_progress' && data.newStatus === 'finalized') return true;
	return false;
}, {
	message: 'Invalid status transition. Only draft->in_progress and in_progress->finalized are allowed'
});

// Type exports
export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type SeedAuditItemsInput = z.infer<typeof seedAuditItemsSchema>;
export type ScanAssetInput = z.infer<typeof scanAssetSchema>;
export type ListAuditsParams = z.infer<typeof listAuditsParamsSchema>;
export type AuditStatusTransition = z.infer<typeof auditStatusTransitionSchema>;