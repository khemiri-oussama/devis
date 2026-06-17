//devis.ts
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { devis, clients, settings } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Devis, WorkItem } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

async function getUserId() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (session?.user) return session.user.id
  } catch (error) {
    // Silently continue if auth fails
  }
  // Use default user ID for offline-first mode
  return 'demo-user'
}

// Shapes a raw DB row into the client-facing Devis shape. Centralized here
// so every getter applies identical defaults. Because the new columns are
// `notNull().default(...)` in the schema, any row inserted AFTER the
// migration will always have a real value — the `??` fallbacks below only
// matter for rows that existed before the migration ran (Postgres backfills
// the default for existing rows on ALTER TABLE ADD COLUMN ... DEFAULT, so
// in practice this should rarely trigger, but it's kept as a safety net).
function shapeDevis(d: any) {
  return {
    ...d,
    amount: d.amount?.toString() || '0',
    taxes: d.taxes?.toString() || '0',
    ttc: d.ttc?.toString() || '0',
    workItems: (d.workItems as unknown as WorkItem[]) || [],
    taxMode: d.taxMode ?? 'ttc',
    passageCount: d.passageCount ?? 1,
    passageSamePrice: d.passageSamePrice ?? true,
    passageUnitPrice: d.passageUnitPrice?.toString() ?? '',
    passagePrices: (d.passagePrices as unknown as string[]) ?? [],
  }
}

export async function getAllDevis() {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(devis)
    .where(eq(devis.userId, userId))
    .orderBy(desc(devis.createdAt))

  return result.map(shapeDevis)
}

export async function getDevisList() {
  return getAllDevis()
}

export async function getDevisById(id: string) {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(devis)
    .where(and(eq(devis.id, id), eq(devis.userId, userId)))
    .limit(1)

  if (!result.length) throw new Error('Devis not found')

  return shapeDevis(result[0])
}

export async function createDevis(data: Omit<Devis, 'id' | 'createdAt' | 'updatedAt'>) {
  console.log('[v0] Server action createDevis called with:', data);
  const userId = await getUserId()
  const id = uuidv4()

  // Generate a devis number if not provided
  let devisNumber = data.number;
  if (!devisNumber || devisNumber.trim() === '') {
    const existingDevis = await db
      .select()
      .from(devis)
      .where(eq(devis.userId, userId))

    const nextNumber = String(existingDevis.length + 1).padStart(3, '0');
    devisNumber = `N°${nextNumber}`;
  }

  console.log('[v0] Generated devis number:', devisNumber);

  // Read tax/passage fields off the incoming payload, same treatment as
  // every other field below. Without this, a brand-new devis always fell
  // back to the column DEFAULT (taxMode='ttc', passageCount=1) regardless
  // of what was actually chosen in the editor — this is what caused new
  // devis to print without the new settings.
  const taxMode = (data as any).taxMode ?? 'ttc'
  const passageCount = (data as any).passageCount ?? 1
  const passageSamePrice = (data as any).passageSamePrice ?? true
  const passageUnitPrice = (data as any).passageUnitPrice ?? ''
  const passagePrices = (data as any).passagePrices ?? []

  await db.insert(devis).values({
    id,
    userId,
    number: devisNumber,
    clientId: data.clientId,
    date: data.date,
    emailDate: data.emailDate,
    subject: data.subject || '',
    introduction: data.introduction || '',
    premises: data.premises || '',
    amount: data.amount,
    taxes: data.taxes,
    ttc: data.ttc,
    taxPercentage: data.taxPercentage || 19,
    signatureName: data.signatureName,
    status: data.status,
    workItems: data.workItems as any,
    // NEW
    taxMode,
    passageCount,
    passageSamePrice,
    passageUnitPrice,
    passagePrices: passagePrices as any,
  })

  revalidatePath('/')
  return id
}

export async function updateDevisAction(id: string, data: Partial<Devis>) {
  const userId = await getUserId()

  // Destructure out fields that must never appear in a SET clause.
  // Spreading them causes Drizzle to emit "SET id = $1, createdAt = $2 …"
  // which either violates a PRIMARY KEY constraint or is simply a no-op
  // that still confuses the DB driver.
  const {
    id: _id,           // never overwrite the primary key
    createdAt: _ca,    // managed by the DB
    updatedAt: _ua,    // we set this ourselves below
    userId: _uid,      // never allow a user to reassign ownership
    ...safeData
  } = data as any

  // safeData now legitimately carries taxMode/passageCount/
  // passageSamePrice/passageUnitPrice/passagePrices whenever the editor
  // sends them, since those columns now exist on the `devis` table.

  await db
    .update(devis)
    .set({
      ...safeData,
      updatedAt: new Date(),
    })
    .where(and(eq(devis.id, id), eq(devis.userId, userId)))

  revalidatePath('/')
}

export async function updateDevis(id: string, data: Partial<Devis>) {
  return updateDevisAction(id, data)
}

export async function deleteDevisAction(id: string) {
  const userId = await getUserId()

  await db.delete(devis).where(and(eq(devis.id, id), eq(devis.userId, userId)))

  revalidatePath('/')
}

export async function deleteDevis(id: string) {
  return deleteDevisAction(id)
}

export async function getNextDevisNumber() {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(devis)
    .where(eq(devis.userId, userId))
    .orderBy(desc(devis.createdAt))
    .limit(1)

  if (!result.length) return 'N°001'

  const lastNumber = result[0].number
  const match = lastNumber.match(/\d+/)
  if (!match) return 'N°001'

  const nextNum = (parseInt(match[0]) + 1).toString().padStart(3, '0')
  return `N°${nextNum}`
}