import { eq, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import {
	createLocationSchema,
	updateLocationSchema,
	type CreateLocationInput,
	type UpdateLocationInput
} from './validation/location';

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

// LIST - Mendapatkan semua lokasi
export async function listLocations(): Promise<table.Location[]> {
	const locations = await db
		.select()
		.from(table.location)
		.orderBy(table.location.name);
	
	return locations;
}

// GET TREE - Mendapatkan tree lokasi sederhana
export async function getLocationTree(): Promise<Array<{ id: string; name: string; parentId: string | null }>> {
	const locations = await db
		.select({
			id: table.location.id,
			name: table.location.name,
			parentId: table.location.parentId
		})
		.from(table.location)
		.orderBy(table.location.name);
	
	return locations;
}

// CREATE - Membuat lokasi baru
export async function createLocation(input: CreateLocationInput): Promise<table.Location> {
	const validatedInput = createLocationSchema.parse(input);
	
	// Check if name already exists
	const [existingLocation] = await db
		.select()
		.from(table.location)
		.where(eq(table.location.name, validatedInput.name))
		.limit(1);
	
	if (existingLocation) {
		throw new UniqueConstraintError(`Location with name '${validatedInput.name}' already exists`);
	}
	
	const locationId = validatedInput.id || nanoid();
	const now = nowDate();
	
	const newLocation: table.Location = {
		id: locationId,
		name: validatedInput.name,
		parentId: validatedInput.parentId || null,
		notes: validatedInput.notes || null,
		createdAt: now,
		updatedAt: now
	};
	
	try {
		await db.insert(table.location).values(newLocation);
		return newLocation;
	} catch (error: any) {
		if (error.message?.includes('UNIQUE constraint failed')) {
			throw new UniqueConstraintError(`Location with name '${validatedInput.name}' already exists`);
		}
		throw error;
	}
}

// UPDATE - Memperbarui lokasi berdasarkan ID
export async function updateLocation(id: string, patch: UpdateLocationInput): Promise<table.Location> {
	const validatedPatch = updateLocationSchema.parse(patch);
	
	// Check if location exists
	const [existingLocation] = await db
		.select()
		.from(table.location)
		.where(eq(table.location.id, id))
		.limit(1);
	
	if (!existingLocation) {
		throw new Error(`Location with id '${id}' not found`);
	}
	
	// Check if name is being updated and if it conflicts
	if (validatedPatch.name && validatedPatch.name !== existingLocation.name) {
		const [nameConflict] = await db
			.select()
			.from(table.location)
			.where(eq(table.location.name, validatedPatch.name))
			.limit(1);
			
		if (nameConflict) {
			throw new UniqueConstraintError(`Location with name '${validatedPatch.name}' already exists`);
		}
	}
	
	// Prepare update data
	const updateData: Partial<table.Location> = {
		updatedAt: nowDate()
	};
	
	if (validatedPatch.name !== undefined) updateData.name = validatedPatch.name;
	if (validatedPatch.parentId !== undefined) updateData.parentId = validatedPatch.parentId;
	if (validatedPatch.notes !== undefined) updateData.notes = validatedPatch.notes;
	
	try {
		await db
			.update(table.location)
			.set(updateData)
			.where(eq(table.location.id, id));
			
		// Return updated location
		const [updatedLocation] = await db
			.select()
			.from(table.location)
			.where(eq(table.location.id, id))
			.limit(1);
			
		if (!updatedLocation) {
			throw new Error(`Failed to retrieve updated location`);
		}
		return updatedLocation;
	} catch (error: any) {
		if (error.message?.includes('UNIQUE constraint failed')) {
			throw new UniqueConstraintError(`Location with name '${validatedPatch.name}' already exists`);
		}
		throw error;
	}
}

// DELETE - Menghapus lokasi berdasarkan ID
export async function deleteLocation(id: string): Promise<void> {
	// Check if location exists
	const [existingLocation] = await db
		.select()
		.from(table.location)
		.where(eq(table.location.id, id))
		.limit(1);
	
	if (!existingLocation) {
		throw new Error(`Location with id '${id}' not found`);
	}
	
	// Check if location is still being used by assets
	const [assetUsingLocation] = await db
		.select({ count: count() })
		.from(table.asset)
		.where(eq(table.asset.locationId, id));
	
	if (assetUsingLocation.count > 0) {
		throw new ForeignKeyInUseError(`Cannot delete location '${existingLocation.name}' because it is still being used by ${assetUsingLocation.count} asset(s)`);
	}
	
	// Check if location has child locations
	const [childLocation] = await db
		.select({ count: count() })
		.from(table.location)
		.where(eq(table.location.parentId, id));
	
	if (childLocation.count > 0) {
		throw new ForeignKeyInUseError(`Cannot delete location '${existingLocation.name}' because it has ${childLocation.count} child location(s)`);
	}
	
	// Delete location
	await db.delete(table.location).where(eq(table.location.id, id));
}