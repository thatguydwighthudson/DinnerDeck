'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { hashPassword, verifyPassword, createSession, deleteSession } from '@/lib/auth'

export type AuthFormState = { errors?: Record<string, string> } | undefined

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string
  const householdSize = Number(formData.get('household_size') ?? 2)
  const dietaryPreferences = formData.getAll('dietary_preferences') as string[]

  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Name is required'
  if (!email || !email.includes('@')) errors.email = 'Valid email is required'
  if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters'
  if (Object.keys(errors).length) return { errors }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length) return { errors: { email: 'An account with this email already exists' } }

  const passwordHash = await hashPassword(password)
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      householdSize,
      dietaryPreferences,
    })
    .returning()

  await createSession(user.id)
  redirect('/onboarding')
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) return { errors: { email: 'No account found with this email' } }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return { errors: { password: 'Incorrect password' } }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function signOut() {
  await deleteSession()
  redirect('/signin')
}
