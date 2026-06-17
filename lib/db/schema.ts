import { pgTable, text, timestamp, boolean, serial, integer, decimal, jsonb } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Add your app tables below. Always include a plain `userId` column so queries
// can be scoped per user — the security model depends on this column existing,
// not on a foreign key. Do NOT add a foreign key constraint
// (`.references(() => user.id, ...)`) unless the user explicitly asks for
// foreign keys or referential integrity; FK constraints make iterating on the
// schema harder.
//
// Example:
//
// import { serial } from "drizzle-orm/pg-core"
//
// export const todos = pgTable("todos", {
//   id: serial("id").primaryKey(),
//   userId: text("userId").notNull(),
//   title: text("title").notNull(),
//   completed: boolean("completed").notNull().default(false),
//   createdAt: timestamp("createdAt").notNull().defaultNow(),
// })
//
// If the user asks for foreign keys, add the reference back in:
//   userId: text("userId")
//     .notNull()
//     .references(() => user.id, { onDelete: "cascade" }),

export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull(),
  companyName: text('companyname').notNull(),
  contactPerson: text('contactperson'),
  title: text('title'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('createdat').notNull().defaultNow(),
  updatedAt: timestamp('updatedat').notNull().defaultNow(),
})

export const devis = pgTable('devis', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull(),
  number: text('number').notNull(),
  clientId: text('clientid').notNull(),
  date: text('date').notNull(),
  emailDate: text('emaildate').notNull(),
  subject: text('subject'),
  introduction: text('introduction'),
  premises: text('premises'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull().default('0'),
  taxes: decimal('taxes', { precision: 10, scale: 2 }).notNull().default('0'),
  ttc: decimal('ttc', { precision: 10, scale: 2 }).notNull().default('0'),
  // FIX: was `serial(...)` — serial is an auto-incrementing identity column,
  // not a plain settable integer. Using it here meant every insert/update
  // that tried to set taxPercentage explicitly was fighting the column's
  // real purpose (each row would silently get the next sequence value
  // instead of the 19 or 0 you actually sent). Changed to `integer`.
  taxPercentage: integer('taxpercentage').notNull().default(19),
  signatureName: text('signaturename').notNull().default('Fayçal Jelloul'),
  status: text('status').notNull().default('draft'),
  workItems: jsonb('workitems').notNull().default('[]'),

  // ── NEW: tax mode toggle (TVA vs HT) ──────────────────────────────────
  taxMode: text('taxmode').notNull().default('ttc'), // 'ttc' | 'ht'

  // ── NEW: passages (visits) pricing ────────────────────────────────────
  passageCount: integer('passagecount').notNull().default(1),
  passageSamePrice: boolean('passagesameprice').notNull().default(true),
  // stored as text to match the amount/taxes/ttc string-based pattern
  // already used throughout devis.ts (parseFloat on read, string on write)
  passageUnitPrice: text('passageunitprice').notNull().default(''),
  // string[] of per-passage prices, only used when passageSamePrice=false
  passagePrices: jsonb('passageprices').notNull().default('[]'),

  createdAt: timestamp('createdat').notNull().defaultNow(),
  updatedAt: timestamp('updatedat').notNull().defaultNow(),
})

export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull(),
  name: text('name').notNull(),
  introduction: text('introduction'),
  signature: text('signature').notNull().default('Fayçal Jelloul'),
  content: jsonb('content').notNull().default('{}'),
  createdAt: timestamp('createdat').notNull().defaultNow(),
  updatedAt: timestamp('updatedat').notNull().defaultNow(),
})

export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  userId: text('userid').notNull().unique(),
  companyName: text('companyname').notNull(),
  companyAddress: text('companyaddress').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  defaultSignature: text('defaultsignature').notNull().default('Fayçal Jelloul'),
  currency: text('currency').notNull().default('DT'),
  taxLabel: text('taxlabel').notNull().default('TVA'),
  // Same fix as devis.taxPercentage above — was `serial(...)`.
  taxPercentage: integer('taxpercentage').notNull().default(19),
  darkMode: boolean('darkmode').notNull().default(false),
  logoUrl: text('logourl'),
  stampUrl: text('stampurl'),
  createdAt: timestamp('createdat').notNull().defaultNow(),
  updatedAt: timestamp('updatedat').notNull().defaultNow(),
})