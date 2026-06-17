'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Client } from '@/lib/types'
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

export async function getAllClients() {
  const userId = await getUserId()
  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt))
}

export async function getClientsList() {
  return getAllClients()
}

export async function getClientById(id: string) {
  const userId = await getUserId()
  const result = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .limit(1)
  
  return result[0] || null
}

export async function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
  console.log('[v0] Server action createClient called with:', data);
  const userId = await getUserId()
  console.log('[v0] Got userId:', userId);
  const id = uuidv4()
  console.log('[v0] Generated id:', id);
  
  try {
    await db.insert(clients).values({
      id,
      userId,
      companyName: data.companyName,
      contactPerson: data.contactPerson || '',
      title: data.title || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      notes: data.notes || '',
    })
    console.log('[v0] Client inserted successfully');
  } catch (error) {
    console.error('[v0] Error inserting client:', error);
    throw error;
  }
  
  revalidatePath('/')
  return id
}

export async function updateClientAction(id: string, data: Partial<Client>) {
  const userId = await getUserId()
  
  await db
    .update(clients)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
  
  revalidatePath('/')
}

export async function updateClient(id: string, data: Partial<Client>) {
  return updateClientAction(id, data)
}

export async function deleteClientAction(id: string) {
  const userId = await getUserId()
  
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)))
  
  revalidatePath('/')
}

export async function deleteClient(id: string) {
  return deleteClientAction(id)
}
