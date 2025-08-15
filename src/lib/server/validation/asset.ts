import { z } from 'zod';

// Asset status enum validation
export const assetStatusSchema = z.enum(['active', 'inactive', 'lost', 'retired', 'maintenance']);

// Create asset input validation
export const createAssetSchema = z.object({
	id: z.string().optional(),
	code: z.string().min(1, 'Code is required'),
	name: z.string().min(1, 'Name is required'),
	categoryId: z.string().nullable().optional(),
	locationId: z.string().nullable().optional(),
	status: assetStatusSchema.optional().default('active'),
	serialNo: z.string().nullable().optional(),
	purchaseDate: z.number().nullable().optional(),
	purchaseCostCents: z.number().nullable().optional(),
	notes: z.string().nullable().optional()
});

// Update asset input validation (partial create schema without id)
export const updateAssetSchema = createAssetSchema
	.partial()
	.omit({ id: true })
	.extend({
		code: z.string().min(1, 'Code is required').optional()
	});

// List assets parameters validation
export const listAssetsParamsSchema = z.object({
	q: z.string().optional(),
	categoryId: z.string().optional(),
	locationId: z.string().optional(),
	status: z.string().optional(),
	limit: z.number().min(1).max(1000).optional().default(50),
	offset: z.number().min(0).optional().default(0),
	orderBy: z.enum(['name', 'createdAt']).optional().default('createdAt')
});

// Type exports
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ListAssetsParams = z.infer<typeof listAssetsParamsSchema>;
export type AssetStatusType = z.infer<typeof assetStatusSchema>;