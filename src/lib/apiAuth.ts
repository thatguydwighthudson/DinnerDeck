import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { type SafeUser, toSafeUser } from '@/lib/auth-shared'

export async function requireUser(): Promise<SafeUser | NextResponse> {
  const row = await getCurrentUser()
  if (!row) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return toSafeUser(row)
}

export function isAuthResponse(value: SafeUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse
}
