import { redirect } from 'next/navigation'
import DinnerDeckApp from '@/components/DinnerDeckApp'
import { getCurrentUser, toSafeUser } from '@/lib/auth'

export default async function DashboardPage() {
  const row = await getCurrentUser()
  if (!row) redirect('/signin')
  return <DinnerDeckApp user={toSafeUser(row)} />
}
