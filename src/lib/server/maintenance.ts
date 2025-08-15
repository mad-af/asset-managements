import { eq, and, count, desc, sum, gte, lte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import {
	openTicketSchema,
	updateTicketSchema,
	listTicketsParamsSchema,
	topAssetsByTicketsParamsSchema,
	totalCostInRangeParamsSchema,
	type OpenTicketInput,
	type UpdateTicketInput,
	type ListTicketsParams,
	type TopAssetsByTicketsParams,
	type TotalCostInRangeParams
} from './validation/maintenance';

// Helper function to get current Unix timestamp
const nowUnix = () => Math.floor(Date.now() / 1000);

// OPEN TICKET - Membuat maintenance order baru
export async function openTicket(input: OpenTicketInput): Promise<table.MaintenanceOrder> {
	const validatedInput = openTicketSchema.parse(input);
	
	// Validate asset exists
	const [asset] = await db
		.select()
		.from(table.asset)
		.where(eq(table.asset.id, validatedInput.assetId))
		.limit(1);
	
	if (!asset) {
		throw new Error(`Asset with id '${validatedInput.assetId}' not found`);
	}
	
	const ticketId = validatedInput.id || nanoid();
	const now = nowUnix();
	
	const newTicket: table.MaintenanceOrder = {
		id: ticketId,
		assetId: validatedInput.assetId,
		title: validatedInput.title,
		description: validatedInput.description || null,
		status: 'open',
		openedAt: new Date(now * 1000),
		closedAt: null,
		costCents: validatedInput.costCents || 0,
		notes: null
	};
	
	await db.insert(table.maintenanceOrder).values(newTicket);
	return newTicket;
}

// UPDATE TICKET - Memperbarui maintenance order
export async function updateTicket(id: string, patch: UpdateTicketInput): Promise<table.MaintenanceOrder> {
	const validatedPatch = updateTicketSchema.parse(patch);
	
	// Check if ticket exists
	const [existingTicket] = await db
		.select()
		.from(table.maintenanceOrder)
		.where(eq(table.maintenanceOrder.id, id))
		.limit(1);
	
	if (!existingTicket) {
		throw new Error(`Maintenance ticket with id '${id}' not found`);
	}
	
	const now = nowUnix();
	const updateData: any = {};
	
	// Update fields if provided
	if (validatedPatch.title !== undefined) {
		updateData.title = validatedPatch.title;
	}
	
	if (validatedPatch.description !== undefined) {
		updateData.description = validatedPatch.description;
	}
	
	if (validatedPatch.costCents !== undefined) {
		updateData.costCents = validatedPatch.costCents;
	}
	
	if (validatedPatch.status !== undefined) {
		updateData.status = validatedPatch.status;
		
		// If status is set to 'done' and closedAt is not set, set closedAt
		if (validatedPatch.status === 'done' && !existingTicket.closedAt) {
			updateData.closedAt = new Date(now * 1000);
		}
	}
	
	// Update ticket
	await db
		.update(table.maintenanceOrder)
		.set(updateData)
		.where(eq(table.maintenanceOrder.id, id));
		
	// Return updated ticket
	const [updatedTicket] = await db
		.select()
		.from(table.maintenanceOrder)
		.where(eq(table.maintenanceOrder.id, id))
		.limit(1);
		
	if (!updatedTicket) {
		throw new Error(`Failed to retrieve updated maintenance ticket`);
	}
	return updatedTicket;
}

// LIST TICKETS - Mendapatkan daftar maintenance tickets dengan filter
export async function listTickets(params?: ListTicketsParams): Promise<{ rows: table.MaintenanceOrder[]; total: number }> {
	const validatedParams = listTicketsParamsSchema.parse(params || {});
	const { assetId, status, limit, offset } = validatedParams;

	// Build where conditions
	const conditions = [];
	
	if (assetId) {
		conditions.push(eq(table.maintenanceOrder.assetId, assetId));
	}
	
	if (status) {
		conditions.push(eq(table.maintenanceOrder.status, status));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Get total count
	const [totalResult] = await db
		.select({ count: count() })
		.from(table.maintenanceOrder)
		.where(whereClause);

	// Get rows with pagination
	const rows = await db
		.select()
		.from(table.maintenanceOrder)
		.where(whereClause)
		.orderBy(desc(table.maintenanceOrder.openedAt))
		.limit(limit)
		.offset(offset);

	return {
		rows,
		total: totalResult.count
	};
}

// TOP ASSETS BY TICKETS - Mendapatkan asset dengan ticket terbanyak
export async function topAssetsByTickets(limit = 10): Promise<Array<{ assetId: string; count: number }>> {
	const validatedLimit = topAssetsByTicketsParamsSchema.parse({ limit }).limit;
	
	const results = await db
		.select({
			assetId: table.maintenanceOrder.assetId,
			count: count()
		})
		.from(table.maintenanceOrder)
		.groupBy(table.maintenanceOrder.assetId)
		.orderBy(desc(count()))
		.limit(validatedLimit);
	
	return results.map(row => ({
		assetId: row.assetId,
		count: row.count
	}));
}

// TOTAL COST IN RANGE - Mendapatkan total biaya maintenance dalam rentang waktu
export async function totalCostInRange(startUnix: number, endUnix: number): Promise<number> {
	const validatedParams = totalCostInRangeParamsSchema.parse({ startUnix, endUnix });
	
	const startDate = new Date(validatedParams.startUnix * 1000);
	const endDate = new Date(validatedParams.endUnix * 1000);
	
	const [result] = await db
		.select({
			total: sum(table.maintenanceOrder.costCents)
		})
		.from(table.maintenanceOrder)
		.where(
			and(
				gte(table.maintenanceOrder.openedAt, startDate),
				lte(table.maintenanceOrder.openedAt, endDate)
			)
		);
	
	return Number(result.total) || 0;
}