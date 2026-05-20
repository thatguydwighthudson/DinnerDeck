import 'server-only'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sessions, users } from '@/db/schema'

export type { SafeUser } from '@/lib/auth-shared'
export { toSafeUser, userMealPlanContext } from '@/lib/auth-shared'

const COOKIE_NAME = 'session_id'
const SESSION_DAYS = 30

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const [session] = await db.insert(sessions).values({ userId, expiresAt }).returning()
  cookies().set(COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  })
  return session
}

export async function getSession() {
  const sessionId = cookies().get(COOKIE_NAME)?.value
  if (!sessionId) return null
  const result = await db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1)
  return result[0] ?? null
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.users ?? null
}

export async function deleteSession() {
  const sessionId = cookies().get(COOKIE_NAME)?.value
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }
  cookies().delete(COOKIE_NAME)
}
