import { eq, and, count, desc, lt, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import {
	checkoutSchema,
	returnAssignmentSchema,
	listAssignmentsParamsSchema,
	listOutstandingParamsSchema,
	type CheckoutInput,
	type ReturnAssignmentInput,
	type ListAssignmentsParams,
	type ListOutstandingParams
} from './validation/assignment';

// Helper function to get current Date
const nowDate = () => new Date();

// Helper function to get current Unix timestamp
const nowUnix = () => Math.floor(Date.now() / 1000);

// Error types
export class AssetAlreadyAssignedError extends Error {
	code = 'ASSET_ALREADY_ASSIGNED';
	constructor(message: string) {
		super(message);
		this.name = 'AssetAlreadyAssignedError';
	}
}

// CHECKOUT - Membuat assignment baru (checkout asset)
export async function checkout(input: CheckoutInput): Promise<table.AssetAssignment> {
	const validatedInput = checkoutSchema.parse(input);
	
	// Validate asset exists
	const [asset] = await db
		.select()
		.from(table.asset)
		.where(eq(table.asset.id, validatedInput.assetId))
		.limit(1);
	
	if (!asset) {
		throw new Error(`Asset with id '${validatedInput.assetId}' not found`);
	}
	
	// Validate user exists
	const [user] = await db
		.select()
		.from(table.user)
		.where(eq(table.user.id, validatedInput.userId))
		.limit(1);
	
	if (!user) {
		throw new Error(`User with id '${validatedInput.userId}' not found`);
	}
	
	// Check if asset is already assigned (returnedAt IS NULL)
	const [activeAssignment] = await db
		.select()
		.from(table.assetAssignment)
		.where(
			and(
				eq(table.assetAssignment.assetId, validatedInput.assetId),
				isNull(table.assetAssignment.returnedAt)
			)
		)
		.limit(1);
	
	if (activeAssignment) {
		throw new AssetAlreadyAssignedError(`Asset '${asset.name}' is already assigned and not yet returned`);
	}
	
	const assignmentId = validatedInput.id || nanoid();
	const now = nowUnix();
	
	const newAssignment: table.AssetAssignment = {
		id: assignmentId,
		assetId: validatedInput.assetId,
		userId: validatedInput.userId,
		assignedAt: new Date(now * 1000),
		dueAt: validatedInput.dueAt ? new Date(validatedInput.dueAt * 1000) : null,
		conditionOut: validatedInput.conditionOut || null,
		notes: validatedInput.notes || null,
		returnedAt: null,
		conditionIn: null
	};
	
	await db.insert(table.assetAssignment).values(newAssignment);
	return newAssignment;
}

// RETURN - Mengembalikan assignment (return asset)
export async function returnAssignment(id: string, input?: ReturnAssignmentInput): Promise<table.AssetAssignment> {
	const validatedInput = input ? returnAssignmentSchema.parse(input) : {};
	
	// Check if assignment exists
	const [existingAssignment] = await db
		.select()
		.from(table.assetAssignment)
		.where(eq(table.assetAssignment.id, id))
		.limit(1);
	
	if (!existingAssignment) {
		throw new Error(`Assignment with id '${id}' not found`);
	}
	
	// Check if already returned
	if (existingAssignment.returnedAt) {
		throw new Error(`Assignment with id '${id}' is already returned`);
	}
	
	const now = nowUnix();
	
	// Update assignment with return information
	await db
		.update(table.assetAssignment)
		.set({
			returnedAt: new Date(now * 1000),
			conditionIn: validatedInput.conditionIn || null,
			notes: validatedInput.notes || existingAssignment.notes
		})
		.where(eq(table.assetAssignment.id, id));
		
	// Return updated assignment
	const [updatedAssignment] = await db
		.select()
		.from(table.assetAssignment)
		.where(eq(table.assetAssignment.id, id))
		.limit(1);
		
	if (!updatedAssignment) {
		throw new Error(`Failed to retrieve updated assignment`);
	}
	return updatedAssignment;
}

// LIST - Mendapatkan daftar assignment dengan filter
export async function listAssignments(params?: ListAssignmentsParams): Promise<{ rows: table.AssetAssignment[]; total: number }> {
	const validatedParams = listAssignmentsParamsSchema.parse(params || {});
	const { userId, assetId, returned, limit, offset } = validatedParams;

	// Build where conditions
	const conditions = [];
	
	if (userId) {
		conditions.push(eq(table.assetAssignment.userId, userId));
	}
	
	if (assetId) {
		conditions.push(eq(table.assetAssignment.assetId, assetId));
	}
	
	if (returned !== undefined) {
		if (returned) {
			// Show only returned assignments
			conditions.push(eq(table.assetAssignment.returnedAt, table.assetAssignment.returnedAt));
		} else {
			// Show only active assignments
			conditions.push(isNull(table.assetAssignment.returnedAt));
		}
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Get total count
	const [totalResult] = await db
		.select({ count: count() })
		.from(table.assetAssignment)
		.where(whereClause);

	// Get rows with pagination
	const rows = await db
		.select()
		.from(table.assetAssignment)
		.where(whereClause)
		.orderBy(desc(table.assetAssignment.assignedAt))
		.limit(limit)
		.offset(offset);

	return {
		rows,
		total: totalResult.count
	};
}

// LIST OUTSTANDING - Mendapatkan assignment yang belum dikembalikan
export async function listOutstanding(params?: ListOutstandingParams): Promise<{ rows: table.AssetAssignment[]; total: number }> {
	const validatedParams = listOutstandingParamsSchema.parse(params || {});
	const { userId, limit, offset } = validatedParams;

	// Build where conditions
	const conditions = [isNull(table.assetAssignment.returnedAt)];
	
	if (userId) {
		conditions.push(eq(table.assetAssignment.userId, userId));
	}

	const whereClause = and(...conditions);

	// Get total count
	const [totalResult] = await db
		.select({ count: count() })
		.from(table.assetAssignment)
		.where(whereClause);

	// Get rows with pagination
	const rows = await db
		.select()
		.from(table.assetAssignment)
		.where(whereClause)
		.orderBy(desc(table.assetAssignment.assignedAt))
		.limit(limit)
		.offset(offset);

	return {
		rows,
		total: totalResult.count
	};
}

// LIST OVERDUE - Mendapatkan assignment yang terlambat
export async function listOverdue(now = nowUnix()): Promise<table.AssetAssignment[]> {
	const nowDate = new Date(now * 1000);
	
	const assignments = await db
		.select()
		.from(table.assetAssignment)
		.where(
			and(
				isNull(table.assetAssignment.returnedAt),
				lt(table.assetAssignment.dueAt, nowDate)
			)
		)
		.orderBy(table.assetAssignment.dueAt);
	
	return assignments;
}