import { eq, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import {
	createCategorySchema,
	updateCategorySchema,
	type CreateCategoryInput,
	type UpdateCategoryInput
} from './validation/category';

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

export class ForeignKeyInUseError extends Error {
	code = 'FK_IN_USE';
	constructor(message: string) {
		super(message);
		this.name = 'ForeignKeyInUseError';
	}
}

// LIST - Mendapatkan semua kategori
export async function listCategories(): Promise<table.AssetCategory[]> {
	const categories = await db
		.select()
		.from(table.assetCategory)
		.orderBy(table.assetCategory.name);
	
	return categories;
}

// CREATE - Membuat kategori baru
export async function createCategory(input: CreateCategoryInput): Promise<table.AssetCategory> {
	const validatedInput = createCategorySchema.parse(input);
	
	// Check if name already exists
	const [existingCategory] = await db
		.select()
		.from(table.assetCategory)
		.where(eq(table.assetCategory.name, validatedInput.name))
		.limit(1);
	
	if (existingCategory) {
		throw new UniqueConstraintError(`Category with name '${validatedInput.name}' already exists`);
	}
	
	const categoryId = validatedInput.id || nanoid();
	const now = nowDate();
	
	const newCategory: table.AssetCategory = {
		id: categoryId,
		name: validatedInput.name,
		description: validatedInput.description || null,
		createdAt: now,
		updatedAt: now
	};
	
	try {
		await db.insert(table.assetCategory).values(newCategory);
		return newCategory;
	} catch (error: any) {
		if (error.message?.includes('UNIQUE constraint failed')) {
			throw new UniqueConstraintError(`Category with name '${validatedInput.name}' already exists`);
		}
		throw error;
	}
}

// UPDATE - Memperbarui kategori berdasarkan ID
export async function updateCategory(id: string, patch: UpdateCategoryInput): Promise<table.AssetCategory> {
	const validatedPatch = updateCategorySchema.parse(patch);
	
	// Check if category exists
	const [existingCategory] = await db
		.select()
		.from(table.assetCategory)
		.where(eq(table.assetCategory.id, id))
		.limit(1);
	
	if (!existingCategory) {
		throw new Error(`Category with id '${id}' not found`);
	}
	
	// Check if name is being updated and if it conflicts
	if (validatedPatch.name && validatedPatch.name !== existingCategory.name) {
		const [nameConflict] = await db
			.select()
			.from(table.assetCategory)
			.where(eq(table.assetCategory.name, validatedPatch.name))
			.limit(1);
			
		if (nameConflict) {
			throw new UniqueConstraintError(`Category with name '${validatedPatch.name}' already exists`);
		}
	}
	
	// Prepare update data
	const updateData: Partial<table.AssetCategory> = {
		updatedAt: nowDate()
	};
	
	if (validatedPatch.name !== undefined) updateData.name = validatedPatch.name;
	if (validatedPatch.description !== undefined) updateData.description = validatedPatch.description;
	
	try {
		await db
			.update(table.assetCategory)
			.set(updateData)
			.where(eq(table.assetCategory.id, id));
			
		// Return updated category
		const [updatedCategory] = await db
			.select()
			.from(table.assetCategory)
			.where(eq(table.assetCategory.id, id))
			.limit(1);
			
		if (!updatedCategory) {
			throw new Error(`Failed to retrieve updated category`);
		}
		return updatedCategory;
	} catch (error: any) {
		if (error.message?.includes('UNIQUE constraint failed')) {
			throw new UniqueConstraintError(`Category with name '${validatedPatch.name}' already exists`);
		}
		throw error;
	}
}

// DELETE - Menghapus kategori berdasarkan ID
export async function deleteCategory(id: string): Promise<void> {
	// Check if category exists
	const [existingCategory] = await db
		.select()
		.from(table.assetCategory)
		.where(eq(table.assetCategory.id, id))
		.limit(1);
	
	if (!existingCategory) {
		throw new Error(`Category with id '${id}' not found`);
	}
	
	// Check if category is still being used by assets
	const [assetUsingCategory] = await db
		.select({ count: count() })
		.from(table.asset)
		.where(eq(table.asset.categoryId, id));
	
	if (assetUsingCategory.count > 0) {
		throw new ForeignKeyInUseError(`Cannot delete category '${existingCategory.name}' because it is still being used by ${assetUsingCategory.count} asset(s)`);
	}
	
	// Delete category
	await db.delete(table.assetCategory).where(eq(table.assetCategory.id, id));
}