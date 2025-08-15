import { eq, and, count, isNull, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import {
	createAuditSchema,
	seedAuditItemsSchema,
	scanAssetSchema,
	listAuditsParamsSchema,
	auditStatusTransitionSchema,
	type CreateAuditInput,
	type SeedAuditItemsInput,
	type ScanAssetInput,
	type ListAuditsParams
} from './validation/audit';

// Helper function to get current Unix timestamp
const nowUnix = () => Math.floor(Date.now() / 1000);

// Error types
export class InvalidStatusTransitionError extends Error {
	code = 'INVALID_STATUS_TRANSITION';
	constructor(message: string) {
		super(message);
		this.name = 'InvalidStatusTransitionError';
	}
}

// CREATE AUDIT - Membuat audit baru
export async function createAudit(input: CreateAuditInput): Promise<table.Audit> {
	const validatedInput = createAuditSchema.parse(input);
	
	// Validate location exists if provided
	if (validatedInput.locationId) {
		const [location] = await db
			.select()
			.from(table.location)
			.where(eq(table.location.id, validatedInput.locationId))
			.limit(1);
		
		if (!location) {
			throw new Error(`Location with id '${validatedInput.locationId}' not found`);
		}
	}
	
	const auditId = validatedInput.id || nanoid();
	const now = nowUnix();
	
	const newAudit: table.Audit = {
		id: auditId,
		locationId: validatedInput.locationId || null,
		title: validatedInput.title,
		status: 'draft',
		startedAt: null,
		finalizedAt: null,
		notes: validatedInput.notes || null,
		createdAt: new Date(now * 1000),
		updatedAt: new Date(now * 1000)
	};
	
	await db.insert(table.audit).values(newAudit);
	return newAudit;
}

// START AUDIT - Memulai audit (draft -> in_progress)
export async function startAudit(id: string): Promise<table.Audit> {
	// Check if audit exists
	const [existingAudit] = await db
		.select()
		.from(table.audit)
		.where(eq(table.audit.id, id))
		.limit(1);
	
	if (!existingAudit) {
		throw new Error(`Audit with id '${id}' not found`);
	}
	
	// Validate status transition
	auditStatusTransitionSchema.parse({
		currentStatus: existingAudit.status as 'draft' | 'in_progress' | 'finalized',
		newStatus: 'in_progress'
	});
	
	const now = nowUnix();
	
	// Update audit status
	await db
		.update(table.audit)
		.set({
			status: 'in_progress',
			startedAt: new Date(now * 1000),
			updatedAt: new Date(now * 1000)
		})
		.where(eq(table.audit.id, id));
		
	// Return updated audit
	const [updatedAudit] = await db
		.select()
		.from(table.audit)
		.where(eq(table.audit.id, id))
		.limit(1);
		
	if (!updatedAudit) {
		throw new Error(`Failed to retrieve updated audit`);
	}
	return updatedAudit;
}

// FINALIZE AUDIT - Menyelesaikan audit (in_progress -> finalized)
export async function finalizeAudit(id: string): Promise<table.Audit> {
	// Check if audit exists
	const [existingAudit] = await db
		.select()
		.from(table.audit)
		.where(eq(table.audit.id, id))
		.limit(1);
	
	if (!existingAudit) {
		throw new Error(`Audit with id '${id}' not found`);
	}
	
	// Validate status transition
	auditStatusTransitionSchema.parse({
		currentStatus: existingAudit.status as 'draft' | 'in_progress' | 'finalized',
		newStatus: 'finalized'
	});
	
	const now = nowUnix();
	
	// Update audit status
	await db
		.update(table.audit)
		.set({
			status: 'finalized',
			finalizedAt: new Date(now * 1000),
			updatedAt: new Date(now * 1000)
		})
		.where(eq(table.audit.id, id));
		
	// Return updated audit
	const [updatedAudit] = await db
		.select()
		.from(table.audit)
		.where(eq(table.audit.id, id))
		.limit(1);
		
	if (!updatedAudit) {
		throw new Error(`Failed to retrieve updated audit`);
	}
	return updatedAudit;
}

// SEED AUDIT ITEMS - Auto-generate audit items untuk semua asset di lokasi
export async function seedAuditItemsFromLocation(auditId: string, locationId: string): Promise<number> {
	const validatedInput = seedAuditItemsSchema.parse({ auditId, locationId });
	
	// Validate audit exists
	const [audit] = await db
		.select()
		.from(table.audit)
		.where(eq(table.audit.id, validatedInput.auditId))
		.limit(1);
	
	if (!audit) {
		throw new Error(`Audit with id '${validatedInput.auditId}' not found`);
	}
	
	// Validate location exists
	const [location] = await db
		.select()
		.from(table.location)
		.where(eq(table.location.id, validatedInput.locationId))
		.limit(1);
	
	if (!location) {
		throw new Error(`Location with id '${validatedInput.locationId}' not found`);
	}
	
	// Get all assets in the location
	const assetsInLocation = await db
		.select()
		.from(table.asset)
		.where(eq(table.asset.locationId, validatedInput.locationId));
	
	// Get existing audit items for this audit
	const existingAuditItems = await db
		.select({ assetId: table.auditItem.assetId })
		.from(table.auditItem)
		.where(eq(table.auditItem.auditId, validatedInput.auditId));
	
	const existingAssetIds = new Set(existingAuditItems.map(item => item.assetId));
	
	// Create audit items for assets that don't have them yet
	const newAuditItems = assetsInLocation
		.filter(asset => !existingAssetIds.has(asset.id))
		.map(asset => ({
			id: nanoid(),
			auditId: validatedInput.auditId,
			assetId: asset.id,
			found: false,
			foundLocationId: null,
			condition: null,
			notes: null,
			scannedAt: null
		}));
	
	if (newAuditItems.length > 0) {
		await db.insert(table.auditItem).values(newAuditItems);
	}
	
	return newAuditItems.length;
}

// SCAN ASSET - Scan asset dan update audit item
export async function scanAsset(auditId: string, assetCodeOrId: string, payload?: { foundLocationId?: string|null; condition?: string|null; notes?: string|null }): Promise<table.AuditItem> {
	const validatedInput = scanAssetSchema.parse({ auditId, assetCodeOrId, payload });
	
	// Validate audit exists
	const [audit] = await db
		.select()
		.from(table.audit)
		.where(eq(table.audit.id, validatedInput.auditId))
		.limit(1);
	
	if (!audit) {
		throw new Error(`Audit with id '${validatedInput.auditId}' not found`);
	}
	
	// Find asset by code first, then by id
	let asset = await db
		.select()
		.from(table.asset)
		.where(eq(table.asset.code, validatedInput.assetCodeOrId))
		.limit(1)
		.then(results => results[0]);
	
	if (!asset) {
		asset = await db
			.select()
			.from(table.asset)
			.where(eq(table.asset.id, validatedInput.assetCodeOrId))
			.limit(1)
			.then(results => results[0]);
	}
	
	if (!asset) {
		throw new Error(`Asset with code or id '${validatedInput.assetCodeOrId}' not found`);
	}
	
	// Check if audit item exists
	let [existingAuditItem] = await db
		.select()
		.from(table.auditItem)
		.where(
			and(
				eq(table.auditItem.auditId, validatedInput.auditId),
				eq(table.auditItem.assetId, asset.id)
			)
		)
		.limit(1);
	
	const now = nowUnix();
	
	// If audit item doesn't exist, create it (lazy add)
	if (!existingAuditItem) {
		const newAuditItem: table.AuditItem = {
			id: nanoid(),
			auditId: validatedInput.auditId,
			assetId: asset.id,
			found: true,
			foundLocationId: validatedInput.payload?.foundLocationId || null,
			condition: validatedInput.payload?.condition || null,
			notes: validatedInput.payload?.notes || null,
			scannedAt: new Date(now * 1000)
		};
		
		await db.insert(table.auditItem).values(newAuditItem);
		return newAuditItem;
	}
	
	// Update existing audit item
	await db
		.update(table.auditItem)
		.set({
			found: true,
			foundLocationId: validatedInput.payload?.foundLocationId || existingAuditItem.foundLocationId,
			condition: validatedInput.payload?.condition || existingAuditItem.condition,
			notes: validatedInput.payload?.notes || existingAuditItem.notes,
			scannedAt: new Date(now * 1000)
		})
		.where(eq(table.auditItem.id, existingAuditItem.id));
		
	// Return updated audit item
	const [updatedAuditItem] = await db
		.select()
		.from(table.auditItem)
		.where(eq(table.auditItem.id, existingAuditItem.id))
		.limit(1);
		
	if (!updatedAuditItem) {
		throw new Error(`Failed to retrieve updated audit item`);
	}
	return updatedAuditItem;
}

// GET AUDIT PROGRESS - Mendapatkan progress audit
export async function getAuditProgress(auditId: string): Promise<{ total: number; found: number; percent: number }> {
	// Validate audit exists
	const [audit] = await db
		.select()
		.from(table.audit)
		.where(eq(table.audit.id, auditId))
		.limit(1);
	
	if (!audit) {
		throw new Error(`Audit with id '${auditId}' not found`);
	}
	
	// Get total count
	const [totalResult] = await db
		.select({ count: count() })
		.from(table.auditItem)
		.where(eq(table.auditItem.auditId, auditId));
	
	// Get found count
	const [foundResult] = await db
		.select({ count: count() })
		.from(table.auditItem)
		.where(
			and(
				eq(table.auditItem.auditId, auditId),
				eq(table.auditItem.found, true)
			)
		);
	
	const total = totalResult.count;
	const found = foundResult.count;
	const percent = total > 0 ? Math.round((found / total) * 100) : 0;
	
	return { total, found, percent };
}

// GET LOCATION MISMATCH - Mendapatkan asset dengan lokasi berbeda
export async function getLocationMismatch(auditId: string): Promise<Array<{ assetId: string; expectedLocationId: string|null; foundLocationId: string|null }>> {
	// Validate audit exists
	const [audit] = await db
		.select()
		.from(table.audit)
		.where(eq(table.audit.id, auditId))
		.limit(1);
	
	if (!audit) {
		throw new Error(`Audit with id '${auditId}' not found`);
	}
	
	// Get audit items with location mismatch
	const mismatchItems = await db
		.select({
			assetId: table.auditItem.assetId,
			foundLocationId: table.auditItem.foundLocationId,
			expectedLocationId: table.asset.locationId
		})
		.from(table.auditItem)
		.innerJoin(table.asset, eq(table.auditItem.assetId, table.asset.id))
		.where(
			and(
				eq(table.auditItem.auditId, auditId),
				eq(table.auditItem.found, true),
				ne(table.auditItem.foundLocationId, table.asset.locationId)
			)
		);
	
	return mismatchItems.map(item => ({
		assetId: item.assetId,
		expectedLocationId: item.expectedLocationId,
		foundLocationId: item.foundLocationId
	}));
}

// LIST AUDITS - Mendapatkan daftar audit dengan filter
export async function listAudits(params?: ListAuditsParams): Promise<table.Audit[]> {
	const validatedParams = listAuditsParamsSchema.parse(params || {});
	const { status } = validatedParams;
	
	const conditions = [];
	
	if (status) {
		conditions.push(eq(table.audit.status, status));
	}
	
	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
	
	const audits = await db
		.select()
		.from(table.audit)
		.where(whereClause)
		.orderBy(table.audit.createdAt);
	
	return audits;
}