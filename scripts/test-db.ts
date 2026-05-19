import { db } from '../src/lib/db'
import { meals } from '../src/db/schema'

async function main() {
  console.log('DATABASE_URL set:', Boolean(process.env.DATABASE_URL))
  const rows = await db.select().from(meals).limit(1)
  console.log('OK', rows.length, 'rows')
}

main().catch((e) => {
  console.error('FAILED:', e)
  process.exit(1)
})
