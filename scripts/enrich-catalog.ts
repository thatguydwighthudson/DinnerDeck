/**
 * Fill CuratedRecipe.enriched from each source_url via Claude + web search.
 *
 * Requires .env with DATABASE_URL and ANTHROPIC_API_KEY (or export them).
 *
 * Usage:
 *   npm run enrich-catalog
 *   npm run enrich-catalog -- --limit 10
 *   npm run enrich-catalog -- --id 42
 *   npm run enrich-catalog -- --force
 *   npm run enrich-catalog -- --delay 3000
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../src/lib/db'
import { curatedRecipes } from '../src/db/schema'
import { buildEnrichedPayload, importRecipeFromUrl } from '../src/lib/importRecipeFromUrl'

function loadEnvFile() {
  try {
    const path = resolve(process.cwd(), '.env')
    const content = readFileSync(path, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // .env optional if vars already exported
  }
}

function parseArgs(argv: string[]) {
  const opts = {
    limit: Infinity,
    id: null as number | null,
    force: false,
    delayMs: 2500,
    deactivateOnFail: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--force') opts.force = true
    else if (arg === '--deactivate-on-fail') opts.deactivateOnFail = true
    else if (arg === '--limit' && argv[i + 1]) opts.limit = parseInt(argv[++i], 10)
    else if (arg === '--id' && argv[i + 1]) opts.id = parseInt(argv[++i], 10)
    else if (arg === '--delay' && argv[i + 1]) opts.delayMs = parseInt(argv[++i], 10)
  }
  return opts
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  loadEnvFile()

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set (use .env or export)')
    process.exit(1)
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set (use .env or export)')
    process.exit(1)
  }

  const opts = parseArgs(process.argv.slice(2))

  const conditions = [eq(curatedRecipes.active, true)]
  if (opts.id != null) {
    conditions.push(eq(curatedRecipes.id, opts.id))
  } else if (!opts.force) {
    conditions.push(isNull(curatedRecipes.enriched))
  }

  let rows = await db
    .select()
    .from(curatedRecipes)
    .where(and(...conditions))
    .orderBy(curatedRecipes.id)

  if (opts.id == null && Number.isFinite(opts.limit)) {
    rows = rows.slice(0, opts.limit)
  }

  if (!rows.length) {
    console.log('No catalog rows to enrich.')
    return
  }

  console.log(
    `Enriching ${rows.length} row(s)${opts.force ? ' (force)' : ''} — ${opts.delayMs}ms delay between calls\n`
  )

  let ok = 0
  let failed = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const label = `[${i + 1}/${rows.length}] #${row.id} ${row.name}`
    process.stdout.write(`${label} … `)

    try {
      const imported = await importRecipeFromUrl(row.sourceUrl)
      const enriched = buildEnrichedPayload(imported, row.sourceUrl, {
        name: row.name,
        emoji: row.emoji,
        tags: row.tags ?? [],
        isVeg: row.isVeg,
      })

      if (!enriched.name) {
        throw new Error('Enriched payload missing name')
      }

      await db
        .update(curatedRecipes)
        .set({
          enriched,
          updatedAt: new Date(),
        })
        .where(eq(curatedRecipes.id, row.id))

      console.log('ok')
      ok++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`FAILED — ${msg}`)
      failed++

      if (opts.deactivateOnFail) {
        await db
          .update(curatedRecipes)
          .set({ active: false, updatedAt: new Date() })
          .where(eq(curatedRecipes.id, row.id))
      }
    }

    if (i < rows.length - 1 && opts.delayMs > 0) {
      await sleep(opts.delayMs)
    }
  }

  console.log(`\nDone: ${ok} enriched, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
