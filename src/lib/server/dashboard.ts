import { eq, and, count, sum, gte, lte, isNull, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

// Helper function to get current Unix timestamp
const nowUnix = () => Math.floor(Date.now() / 1000);

// SUMMARY ASSETS - Ringkasan asset berdasarkan status, kategori, dan lokasi
export async function summaryAssets(): Promise<{
	total: number;
	byStatus: Record<string, number>;
	byCategory: Array<{ categoryId: string | null; count: number }>;
	byLocation: Array<{ locationId: string | null; count: number }>;
}> {
	// Get total count
	const [totalResult] = await db
		.select({ count: count() })
		.from(table.asset);

	// Get count by status using optimized query
	const statusResults = await db
		.select({
			status: table.asset.status,
			count: count()
		})
		.from(table.asset)
		.groupBy(table.asset.status);

	// Get count by category
	const categoryResults = await db
		.select({
			categoryId: table.asset.categoryId,
			count: count()
		})
		.from(table.asset)
		.groupBy(table.asset.categoryId);

	// Get count by location
	const locationResults = await db
		.select({
			locationId: table.asset.locationId,
			count: count()
		})
		.from(table.asset)
		.groupBy(table.asset.locationId);

	// Transform status results to Record
	const byStatus: Record<string, number> = {};
	statusResults.forEach(result => {
		byStatus[result.status] = result.count;
	});

	return {
		total: totalResult.count,
		byStatus,
		byCategory: categoryResults,
		byLocation: locationResults
	};
}

// SUMMARY ASSIGNMENTS - Ringkasan assignment outstanding dan overdue
export async function summaryAssignments(): Promise<{
	outstanding: number;
	overdue: number;
}> {
	const now = new Date();

	// Get outstanding assignments count (returnedAt IS NULL)
	const [outstandingResult] = await db
		.select({ count: count() })
		.from(table.assetAssignment)
		.where(isNull(table.assetAssignment.returnedAt));

	// Get overdue assignments count (returnedAt IS NULL AND dueAt < now)
	const [overdueResult] = await db
		.select({ count: count() })
		.from(table.assetAssignment)
		.where(
			and(
				isNull(table.assetAssignment.returnedAt),
				lte(table.assetAssignment.dueAt, now)
			)
		);

	return {
		outstanding: outstandingResult.count,
		overdue: overdueResult.count
	};
}

// SUMMARY MAINTENANCE MONTHLY - Ringkasan maintenance bulanan
export async function summaryMaintenanceMonthly(
	year: number,
	month: number
): Promise<{
	open: number;
	done: number;
	totalCostCents: number;
}> {
	// Calculate start and end dates for the month
	const startDate = new Date(year, month - 1, 1); // month is 0-indexed
	const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of month

	// Use optimized single query with conditional aggregation
	const [result] = await db
		.select({
			open: sql<number>`SUM(CASE WHEN ${table.maintenanceOrder.status} = 'open' THEN 1 ELSE 0 END)`,
			done: sql<number>`SUM(CASE WHEN ${table.maintenanceOrder.status} = 'done' THEN 1 ELSE 0 END)`,
			totalCostCents: sum(table.maintenanceOrder.costCents)
		})
		.from(table.maintenanceOrder)
		.where(
			and(
				gte(table.maintenanceOrder.openedAt, startDate),
				lte(table.maintenanceOrder.openedAt, endDate)
			)
		);

	return {
		open: Number(result.open) || 0,
		done: Number(result.done) || 0,
		totalCostCents: Number(result.totalCostCents) || 0
	};
}

// SUMMARY AUDIT - Ringkasan progress audit
export async function summaryAudit(auditId: string): Promise<{
	total: number;
	found: number;
	percent: number;
	mismatches: number;
}> {
	// Validate audit exists
	const [audit] = await db
		.select()
		.from(table.audit)
		.where(eq(table.audit.id, auditId))
		.limit(1);

	if (!audit) {
		throw new Error(`Audit with id '${auditId}' not found`);
	}

	// Use optimized single query with conditional aggregation
	const [progressResult] = await db
		.select({
			total: count(),
			found: sql<number>`SUM(CASE WHEN ${table.auditItem.found} = 1 THEN 1 ELSE 0 END)`
		})
		.from(table.auditItem)
		.where(eq(table.auditItem.auditId, auditId));

	// Get mismatches count with optimized join query
	const [mismatchResult] = await db
		.select({ count: count() })
		.from(table.auditItem)
		.innerJoin(table.asset, eq(table.auditItem.assetId, table.asset.id))
		.where(
			and(
				eq(table.auditItem.auditId, auditId),
				eq(table.auditItem.found, true),
				ne(table.auditItem.foundLocationId, table.asset.locationId)
			)
		);

	const total = progressResult.total;
	const found = Number(progressResult.found) || 0;
	const percent = total > 0 ? Math.round((found / total) * 100) : 0;
	const mismatches = mismatchResult.count;

	return {
		total,
		found,
		percent,
		mismatches
	};
}