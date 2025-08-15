// drizzle/schema.ts
import { sqliteTable, text, integer, real, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/** =========================================================
 *  USER & SESSION (existing, disertakan agar file lengkap)
 *  =======================================================*/
export const user = sqliteTable('user', {
  id: text('id').primaryKey(), // UUID/ULID/string
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  position: text('position'),
  passwordHash: text('password_hash').notNull(),
  biography: text('biography'),
}, (t) => ({
  emailIdx: uniqueIndex('ux_user_email').on(t.email),
}));

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (t) => ({
  userIdx: index('ix_session_user_id').on(t.userId),
}));

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;

/** =========================================================
 *  ENUM-LIKE string literals via CHECK (SQLite)
 *  =======================================================*/
export const assetStatusValues = ['active','inactive','lost','retired','maintenance'] as const;
export type AssetStatus = typeof assetStatusValues[number];

export const maintenanceOrderStatusValues = ['open','in_progress','done','canceled'] as const;
export type MaintenanceOrderStatus = typeof maintenanceOrderStatusValues[number];

export const depreciationMethodValues = ['straight_line','declining_balance'] as const;
export type DepreciationMethod = typeof depreciationMethodValues[number];

/** =========================================================
 *  KATEGORI & LOKASI
 *  =======================================================*/
export const assetCategory = sqliteTable('asset_category', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Define location table without self-reference first
export const location = sqliteTable('location', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code'),
  parentId: text('parent_id'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (t) => ({
  parentIdx: index('ix_location_parent').on(t.parentId),
  nameUx: uniqueIndex('ux_location_name').on(t.name),
}));

/** =========================================================
 *  VENDOR & PEMBELIAN
 *  =======================================================*/
export const vendor = sqliteTable('vendor', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  contact: text('contact'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

export const purchase = sqliteTable('purchase', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id').references(() => vendor.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  poNumber: text('po_number').notNull().unique(),
  orderedAt: integer('ordered_at', { mode: 'timestamp' }),
  receivedAt: integer('received_at', { mode: 'timestamp' }),
  subtotalCents: integer('subtotal_cents'), // uang dalam cents
  taxCents: integer('tax_cents'),
  shippingCents: integer('shipping_cents'),
  totalCents: integer('total_cents'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (t) => ({
  vendorIdx: index('ix_purchase_vendor').on(t.vendorId),
  poUx: uniqueIndex('ux_purchase_po').on(t.poNumber),
}));

export const purchaseItem = sqliteTable('purchase_item', {
  id: text('id').primaryKey(),
  purchaseId: text('purchase_id').notNull().references(() => purchase.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku'),
  qty: integer('qty').notNull().default(1),
  unitPriceCents: integer('unit_price_cents').notNull().default(0),
  totalPriceCents: integer('total_price_cents').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (t) => ({
  purchaseIdx: index('ix_purchase_item_purchase').on(t.purchaseId),
}));

/** =========================================================
 *  ASET
 *  =======================================================*/
export const asset = sqliteTable('asset', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // barcode/QR
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => assetCategory.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  locationId: text('location_id').references(() => location.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  status: text('status', { enum: assetStatusValues }).notNull().default('active'),
  purchaseItemId: text('purchase_item_id').references(() => purchaseItem.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  serialNo: text('serial_no'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  purchaseCostCents: integer('purchase_cost_cents'),
  usefulLifeMonths: integer('useful_life_months'),
  depreciationMethod: text('depreciation_method', { enum: depreciationMethodValues }),
  residualValueCents: integer('residual_value_cents').default(0),
  retiredAt: integer('retired_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (t) => ({
  codeUx: uniqueIndex('ux_asset_code').on(t.code),
  catIdx: index('ix_asset_category').on(t.categoryId),
  locIdx: index('ix_asset_location').on(t.locationId),
}));

/** =========================================================
 *  ASSIGNMENT / CHECKOUT
 *  =======================================================*/
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
  assetIdx: index('ix_assignment_asset').on(t.assetId),
  userIdx: index('ix_assignment_user').on(t.userId),
  outstandingIdx: index('ix_assignment_outstanding').on(t.assetId, t.returnedAt),
}));

/** =========================================================
 *  MAINTENANCE (Schedule & Order)
 *  =======================================================*/
export const maintenanceSchedule = sqliteTable('maintenance_schedule', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').notNull().references(() => asset.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  title: text('title').notNull(),
  frequency: text('frequency').notNull(), // daily|weekly|monthly|quarterly|yearly|custom
  intervalValue: integer('interval_value'), // untuk custom: contoh 3 => setiap 3 bulan
  nextDueAt: integer('next_due_at', { mode: 'timestamp' }),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
}, (t) => ({
  assetIdx: index('ix_maint_sched_asset').on(t.assetId),
  dueIdx: index('ix_maint_sched_next_due').on(t.nextDueAt),
}));

export const maintenanceOrder = sqliteTable('maintenance_order', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').notNull().references(() => asset.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  requestedBy: text('requested_by').references(() => user.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  scheduleId: text('schedule_id').references(() => maintenanceSchedule.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: maintenanceOrderStatusValues }).notNull().default('open'),
  openedAt: integer('opened_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  costCents: integer('cost_cents').default(0),
  vendorId: text('vendor_id').references(() => vendor.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  notes: text('notes'),
}, (t) => ({
  assetIdx: index('ix_maint_order_asset').on(t.assetId),
  statusIdx: index('ix_maint_order_status').on(t.status),
}));

/** =========================================================
 *  AUDIT / INVENTARISASI
 *  =======================================================*/
export const audit = sqliteTable('audit', {
  id: text('id').primaryKey(),
  locationId: text('location_id').references(() => location.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  title: text('title').notNull(),
  status: text('status').notNull().default('draft'), // draft|in_progress|finalized
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

/** =========================================================
 *  DEPRECIATION (opsional granular per periode)
 *  =======================================================*/
export const depreciationEntry = sqliteTable('depreciation_entry', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').notNull().references(() => asset.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  period: text('period').notNull(), // contoh "2025-08"
  amountCents: integer('amount_cents').notNull().default(0),
  accumulatedCents: integer('accumulated_cents').notNull().default(0),
  bookValueCents: integer('book_value_cents').notNull().default(0),
  postedAt: integer('posted_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  uniqAssetPeriod: uniqueIndex('ux_depr_asset_period').on(t.assetId, t.period),
  assetIdx: index('ix_depr_asset').on(t.assetId),
}));

/** =========================================================
 *  GARANSI, LAMPIRAN, TAGGING
 *  =======================================================*/
export const warranty = sqliteTable('warranty', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').notNull().references(() => asset.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  vendorId: text('vendor_id').references(() => vendor.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  warrantyUntil: integer('warranty_until', { mode: 'timestamp' }),
  terms: text('terms'),
}, (t) => ({
  assetUx: uniqueIndex('ux_warranty_asset').on(t.assetId), // 0..1 per asset
  vendorIdx: index('ix_warranty_vendor').on(t.vendorId),
}));

export const attachment = sqliteTable('attachment', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').notNull().references(() => asset.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type'),
  pathOrUrl: text('path_or_url').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  notes: text('notes'),
}, (t) => ({
  assetIdx: index('ix_attachment_asset').on(t.assetId),
}));

export const tag = sqliteTable('tag', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
}, (t) => ({
  nameUx: uniqueIndex('ux_tag_name').on(t.name),
}));

export const assetTag = sqliteTable('asset_tag', {
  assetId: text('asset_id').notNull().references(() => asset.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tag.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ name: 'pk_asset_tag', columns: [t.assetId, t.tagId] }),
  assetIdx: index('ix_asset_tag_asset').on(t.assetId),
  tagIdx: index('ix_asset_tag_tag').on(t.tagId),
}));

/** =========================================================
 *  RBAC (opsional)
 *  =======================================================*/
export const role = sqliteTable('role', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g. admin, manager, auditor, technician
  description: text('description'),
});

export const userRole = sqliteTable('user_role', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  roleId: text('role_id').notNull().references(() => role.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ name: 'pk_user_role', columns: [t.userId, t.roleId] }),
  userIdx: index('ix_user_role_user').on(t.userId),
  roleIdx: index('ix_user_role_role').on(t.roleId),
}));

export const permission = sqliteTable('permission', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. ASSET_READ, ASSET_WRITE, AUDIT_FINALIZE
  description: text('description'),
});

export const rolePermission = sqliteTable('role_permission', {
  roleId: text('role_id').notNull().references(() => role.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permission.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ name: 'pk_role_permission', columns: [t.roleId, t.permissionId] }),
  roleIdx: index('ix_role_perm_role').on(t.roleId),
  permIdx: index('ix_role_perm_perm').on(t.permissionId),
}));

/** =========================================================
 *  TYPES
 *  =======================================================*/
export type Asset = typeof asset.$inferSelect;
export type NewAsset = typeof asset.$inferInsert;

export type AssetCategory = typeof assetCategory.$inferSelect;
export type Location = typeof location.$inferSelect;
export type Vendor = typeof vendor.$inferSelect;
export type Purchase = typeof purchase.$inferSelect;
export type PurchaseItem = typeof purchaseItem.$inferSelect;

export type AssetAssignment = typeof assetAssignment.$inferSelect;
export type MaintenanceSchedule = typeof maintenanceSchedule.$inferSelect;
export type MaintenanceOrder = typeof maintenanceOrder.$inferSelect;

export type Audit = typeof audit.$inferSelect;
export type AuditItem = typeof auditItem.$inferSelect;

export type DepreciationEntry = typeof depreciationEntry.$inferSelect;
export type Warranty = typeof warranty.$inferSelect;
export type Attachment = typeof attachment.$inferSelect;

export type Tag = typeof tag.$inferSelect;
export type AssetTag = typeof assetTag.$inferSelect;

export type Role = typeof role.$inferSelect;
export type UserRole = typeof userRole.$inferSelect;
export type Permission = typeof permission.$inferSelect;
export type RolePermission = typeof rolePermission.$inferSelect;
