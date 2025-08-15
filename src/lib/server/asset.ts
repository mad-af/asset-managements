import { eq, and, or, like, count, desc, asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import {
	createAssetSchema,
	updateAssetSchema,
	listAssetsParamsSchema,
	type CreateAssetInput,
	type UpdateAssetInput,
	type ListAssetsParams
} from './validation/asset';

// Helper function to get current Date
const nowDate = () => new Date();

// Error types
export class UniqueConstraintError extends Error {
	code = 'UNIQUE_CONSTRAINT';
	constructor(message: string) {
		super(message);
		this.name = 'UniqueConstraintError';
	}
}

// LIST - Mendapatkan daftar asset dengan filter dan pagination
export async function listAssets(params?: ListAssetsParams): Promise<{ rows: table.Asset[]; total: number }> {
	const validatedParams = listAssetsParamsSchema.parse(params || {});
	const { q, categoryId, locationId, status, limit, offset, orderBy } = validatedParams;

	// Build where conditions
	const conditions = [];
	
	if (q) {
		conditions.push(
			or(
				like(table.asset.name, `%${q}%`),
				like(table.asset.code, `%${q}%`),
				like(table.asset.serialNo, `%${q}%`)
			)
		);
	}
	
	if (categoryId) {
		conditions.push(eq(table.asset.categoryId, categoryId));
	}
	
	if (locationId) {
		conditions.push(eq(table.asset.locationId, locationId));
	}
	
	if (status) {
		conditions.push(eq(table.asset.status, status as any));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Get total count
	const [totalResult] = await db
		.select({ count: count() })
		.from(table.asset)
		.where(whereClause);

	// Get rows with pagination and ordering
	const orderColumn = orderBy === 'name' ? table.asset.name : table.asset.createdAt;
	const rows = await db
		.select()
		.from(table.asset)
		.where(whereClause)
		.orderBy(desc(orderColumn))
		.limit(limit)
		.offset(offset);

	return {
		rows,
		total: totalResult.count
	};
}

// READ - Mendapatkan asset berdasarkan ID
export async function getAssetById(id: string): Promise<table.Asset | null> {
	const [asset] = await db
		.select()
		.from(table.asset)
		.where(eq(table.asset.id, id))
		.limit(1);
	
	return asset || null;
}

// READ - Mendapatkan asset berdasarkan code
export async function getAssetByCode(code: string): Promise<table.Asset | null> {
	const [asset] = await db
		.select()
		.from(table.asset)
		.where(eq(table.asset.code, code))
		.limit(1);
	
	return asset || null;
}

// CREATE - Membuat asset baru
export async function createAsset(input: CreateAssetInput): Promise<table.Asset> {
	const validatedInput = createAssetSchema.parse(input);
	
	// Check if code already exists
	const existingAsset = await getAssetByCode(validatedInput.code);
	if (existingAsset) {
		throw new UniqueConstraintError(`Asset with code '${validatedInput.code}' already exists`);
	}
	
	const assetId = validatedInput.id || nanoid();
	const now = nowDate();
	
	const newAsset: table.Asset = {
		id: assetId,
		code: validatedInput.code,
		name: validatedInput.name,
		categoryId: validatedInput.categoryId || null,
		locationId: validatedInput.locationId || null,
		status: validatedInput.status || 'active',
		serialNo: validatedInput.serialNo || null,
		purchaseDate: validatedInput.purchaseDate ? new Date(validatedInput.purchaseDate * 1000) : null,
		purchaseCostCents: validatedInput.purchaseCostCents || null,
		notes: validatedInput.notes || null,
		createdAt: now,
		updatedAt: now
	};
	
	try {
		await db.insert(table.asset).values(newAsset);
		return newAsset;
	} catch (error: any) {
		if (error.message?.includes('UNIQUE constraint failed')) {
			throw new UniqueConstraintError(`Asset with code '${validatedInput.code}' already exists`);
		}
		throw error;
	}
}

// UPDATE - Memperbarui asset berdasarkan ID
export async function updateAsset(id: string, patch: UpdateAssetInput): Promise<table.Asset> {
	const validatedPatch = updateAssetSchema.parse(patch);
	
	// Check if asset exists
	const existingAsset = await getAssetById(id);
	if (!existingAsset) {
		throw new Error(`Asset with id '${id}' not found`);
	}
	
	// Check if code is being updated and if it conflicts
	if (validatedPatch.code && validatedPatch.code !== existingAsset.code) {
		const codeConflict = await getAssetByCode(validatedPatch.code);
		if (codeConflict) {
			throw new UniqueConstraintError(`Asset with code '${validatedPatch.code}' already exists`);
		}
	}
	
	// Prepare update data
	const updateData: Partial<table.Asset> = {
		updatedAt: nowDate()
	};
	
	if (validatedPatch.code !== undefined) updateData.code = validatedPatch.code;
	if (validatedPatch.name !== undefined) updateData.name = validatedPatch.name;
	if (validatedPatch.categoryId !== undefined) updateData.categoryId = validatedPatch.categoryId;
	if (validatedPatch.locationId !== undefined) updateData.locationId = validatedPatch.locationId;
	if (validatedPatch.status !== undefined) updateData.status = validatedPatch.status;
	if (validatedPatch.serialNo !== undefined) updateData.serialNo = validatedPatch.serialNo;
	if (validatedPatch.purchaseDate !== undefined) updateData.purchaseDate = validatedPatch.purchaseDate ? new Date(validatedPatch.purchaseDate * 1000) : null;
	if (validatedPatch.purchaseCostCents !== undefined) updateData.purchaseCostCents = validatedPatch.purchaseCostCents;
	if (validatedPatch.notes !== undefined) updateData.notes = validatedPatch.notes;
	
	try {
		await db
			.update(table.asset)
			.set(updateData)
			.where(eq(table.asset.id, id));
			
		// Return updated asset
		const updatedAsset = await getAssetById(id);
		if (!updatedAsset) {
			throw new Error(`Failed to retrieve updated asset`);
		}
		return updatedAsset;
	} catch (error: any) {
		if (error.message?.includes('UNIQUE constraint failed')) {
			throw new UniqueConstraintError(`Asset with code '${validatedPatch.code}' already exists`);
		}
		throw error;
	}
}

// DELETE - Menghapus asset berdasarkan ID
export async function deleteAsset(id: string): Promise<void> {
	// Check if asset exists
	const existingAsset = await getAssetById(id);
	if (!existingAsset) {
		throw new Error(`Asset with id '${id}' not found`);
	}
	
	// Delete asset
	await db.delete(table.asset).where(eq(table.asset.id, id));
}

// MOVE - Update lokasi asset dengan cepat
export async function moveAsset(id: string, locationId: string | null): Promise<table.Asset> {
	// Check if asset exists
	const existingAsset = await getAssetById(id);
	if (!existingAsset) {
		throw new Error(`Asset with id '${id}' not found`);
	}
	
	// Update location
	await db
		.update(table.asset)
		.set({
			locationId,
			updatedAt: nowDate()
		})
		.where(eq(table.asset.id, id));
		
	// Return updated asset
	const updatedAsset = await getAssetById(id);
	if (!updatedAsset) {
		throw new Error(`Failed to retrieve updated asset`);
	}
	return updatedAsset;
}