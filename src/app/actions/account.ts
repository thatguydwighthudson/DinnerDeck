'use server'

import { and, eq, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'

export type AccountFormState = {
  errors?: Record<string, string>
  success?: string
} | undefined

async function requireSessionUser() {
  const user = await getCurrentUser()
  if (!user) return null
  return user
}

export async function updateProfile(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await requireSessionUser()
  if (!user) return { errors: { form: 'You must be signed in' } }

  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.toLowerCase().trim()

  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Name is required'
  if (!email || !email.includes('@')) errors.email = 'Valid email is required'
  if (Object.keys(errors).length) return { errors }

  if (email !== user.email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, user.id)))
      .limit(1)
    if (existing) return { errors: { email: 'An account with this email already exists' } }
  }

  await db
    .update(users)
    .set({ name, email })
    .where(eq(users.id, user.id))

  revalidatePath('/dashboard')
  return { success: 'Profile updated' }
}

export async function changePassword(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await requireSessionUser()
  if (!user) return { errors: { form: 'You must be signed in' } }

  const currentPassword = formData.get('current_password') as string
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  const errors: Record<string, string> = {}
  if (!currentPassword) errors.current_password = 'Current password is required'
  if (!newPassword || newPassword.length < 8) {
    errors.new_password = 'New password must be at least 8 characters'
  }
  if (newPassword !== confirmPassword) {
    errors.confirm_password = 'Passwords do not match'
  }
  if (Object.keys(errors).length) return { errors }

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) return { errors: { current_password: 'Current password is incorrect' } }

  const passwordHash = await hashPassword(newPassword)
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id))

  return { success: 'Password updated' }
}
