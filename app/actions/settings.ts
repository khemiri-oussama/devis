'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Settings, DEFAULT_SETTINGS } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

async function getUserId() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (session?.user) return session.user.id
  } catch (error) {
    // Silently continue if auth fails
  }
  return 'demo-user'
}

export async function getUserSettings() {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1)

  if (result.length) return result[0]

  // First visit: create default row so next load finds it
  const id = uuidv4()
  await db.insert(settings).values({
    id,
    userId,
    companyName:      DEFAULT_SETTINGS.companyName,
    companyAddress:   DEFAULT_SETTINGS.companyAddress,
    phone:            DEFAULT_SETTINGS.phone,
    email:            DEFAULT_SETTINGS.email,
    defaultSignature: DEFAULT_SETTINGS.defaultSignature,
    currency:         DEFAULT_SETTINGS.currency,
    taxLabel:         DEFAULT_SETTINGS.taxLabel,
    taxPercentage:    DEFAULT_SETTINGS.taxPercentage,
    darkMode:         DEFAULT_SETTINGS.darkMode,
  })

  return {
    id,
    userId,
    ...DEFAULT_SETTINGS,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateSettings(data: Partial<Settings>) {
  const userId = await getUserId()

  // Strip fields that must never appear in a SET clause (same fix as devis.ts)
  const {
    id: _id,
    createdAt: _ca,
    updatedAt: _ua,
    userId: _uid,
    ...safeData
  } = data as any

  const existing = await db
    .select({ id: settings.id })
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1)

  if (existing.length) {
    await db
      .update(settings)
      .set({
        ...safeData,
        updatedAt: new Date(),
      })
      .where(eq(settings.userId, userId))
  } else {
    // Row doesn't exist yet — insert with safe defaults
    const id = uuidv4()
    await db.insert(settings).values({
      id,
      userId,
      companyName:      safeData.companyName      ?? DEFAULT_SETTINGS.companyName,
      companyAddress:   safeData.companyAddress   ?? DEFAULT_SETTINGS.companyAddress,
      phone:            safeData.phone            ?? DEFAULT_SETTINGS.phone,
      email:            safeData.email            ?? DEFAULT_SETTINGS.email,
      defaultSignature: safeData.defaultSignature ?? DEFAULT_SETTINGS.defaultSignature,
      currency:         safeData.currency         ?? DEFAULT_SETTINGS.currency,
      taxLabel:         safeData.taxLabel         ?? DEFAULT_SETTINGS.taxLabel,
      taxPercentage:    safeData.taxPercentage    ?? DEFAULT_SETTINGS.taxPercentage,
      darkMode:         safeData.darkMode         ?? DEFAULT_SETTINGS.darkMode,
    })
  }

  revalidatePath('/')
}