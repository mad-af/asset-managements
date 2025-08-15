// drizzle/schema.mvp.ts
import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/* ===========================
   USER & SESSION (existing)
   =========================== */
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  position: text('position'),
  passwordHash: text('password_hash').notNull(),
  biography: text('biography'),
}, (t) => ({
  emailUx: uniqueIndex('ux_user_email').on(t.email),
}));

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (t) => ({
  userIdx: index('ix_session_user').on(t.userId),
}));

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;

/* ===========================
   ENUM-like values
   =========================== */
const assetStatusValues = ['active','inactive','lost','retired','maintenance'] as const;
const maintenanceStatusValues = ['open','in_progress','done','canceled'] as const;

/* ===========================
   KATEGORI & LOKASI
   =========================== */
export const assetCategory = sqliteTable('asset_category', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

export const location = sqliteTable('location', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  parentId: text('parent_id'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (t) => ({
  parentIdx: index('ix_location_parent').on(t.parentId),
  nameUx: uniqueIndex('ux_location_name').on(t.name),
}));

/* ===========================
   ASET (inti)
   =========================== */
export const asset = sqliteTable('asset', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),               // QR/Barcode
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => assetCategory.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  locationId: text('location_id').references(() => location.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  status: text('status').notNull().default('active'),
  serialNo: text('serial_no'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  purchaseCostCents: integer('purchase_cost_cents'),   // optional, dalam cents
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (t) => ({
  codeUx: uniqueIndex('ux_asset_code').on(t.code),
  catIdx: index('ix_asset_category').on(t.categoryId),
  locIdx: index('ix_asset_location').on(t.locationId),
  // Status validation handled by application logic
}));

/* ===========================
   ASSIGNMENT / CHECKOUT
   =========================== */
export const assetAssignment = sqliteTable('asset_assignment', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').notNull().references(() => asset.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  dueAt: integer('due_at', { mode: 'timestamp' }),
  returnedAt: integer('returned_at', { mode: 'timestamp' }),
  conditionOut: text('condition_out'),
  conditionIn: text('condition_in'),
  notes: text('notes'),
}, (t) => ({
  assetIdx: index('ix_assign_asset').on(t.assetId),
  userIdx: index('ix_assign_user').on(t.userId),
  outstandingIdx: index('ix_assign_outstanding').on(t.assetId, t.returnedAt),
}));

/* ===========================
   MAINTENANCE (sederhana)
   =========================== */
export const maintenanceOrder = sqliteTable('maintenance_order', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').notNull().references(() => asset.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('open'),
  openedAt: integer('opened_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  costCents: integer('cost_cents').default(0),
  notes: text('notes'),
}, (t) => ({
  assetIdx: index('ix_maint_asset').on(t.assetId),
  // Status validation handled by application logic
}));

/* ===========================
   AUDIT / INVENTARISASI
   =========================== */
export const audit = sqliteTable('audit', {
  id: text('id').primaryKey(),
  locationId: text('location_id').references(() => location.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  title: text('title').notNull(),
  status: text('status').notNull().default('draft'), // draft|in_progress|finalized (tanpa CHECK agar fleksibel di MVP)
  startedAt: integer('started_at', { mode: 'timestamp' }),
  finalizedAt: integer('finalized_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (t) => ({
  locIdx: index('ix_audit_location').on(t.locationId),
  statusIdx: index('ix_audit_status').on(t.status),
}));

export const auditItem = sqliteTable('audit_item', {
  id: text('id').primaryKey(),
  auditId: text('audit_id').notNull().references(() => audit.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  assetId: text('asset_id').notNull().references(() => asset.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  found: integer('found', { mode: 'boolean' }).notNull().default(false),
  foundLocationId: text('found_location_id').references(() => location.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  condition: text('condition'),
  notes: text('notes'),
  scannedAt: integer('scanned_at', { mode: 'timestamp' }),
}, (t) => ({
  auditIdx: index('ix_audit_item_audit').on(t.auditId),
  assetIdx: index('ix_audit_item_asset').on(t.assetId),
}));

/* ===========================
   TYPES
   =========================== */
export type AssetCategory = typeof assetCategory.$inferSelect;
export type Location = typeof location.$inferSelect;

export type Asset = typeof asset.$inferSelect;
export type NewAsset = typeof asset.$inferInsert;

export type AssetAssignment = typeof assetAssignment.$inferSelect;
export type MaintenanceOrder = typeof maintenanceOrder.$inferSelect;

export type Audit = typeof audit.$inferSelect;
export type AuditItem = typeof auditItem.$inferSelect;
export type AssetStatus = typeof assetStatusValues[number];
export type MaintenanceStatus = typeof maintenanceStatusValues[number];

// Add foreign key reference for location after table definition
// This avoids circular reference issues
// In production, you would add: ALTER TABLE location ADD CONSTRAINT fk_location_parent FOREIGN KEY (parent_id) REFERENCES location(id);
