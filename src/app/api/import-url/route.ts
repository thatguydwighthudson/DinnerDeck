import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { importedUrls, meals } from '@/db/schema'
import type { AlternateRecipe } from '@/lib/types'
import { normalizeMealType } from '@/lib/mealTypes'
import {
  CLAUDE_MODEL,
  WEB_SEARCH_TOOLS,
  extractTextFromMessage,
  parseJsonFromText,
} from '@/lib/anthropic'

const client = new Anthropic()

type ImportResponse = {
  meal: {
    name: string
    emoji?: string
    tags?: string[]
    isVeg?: boolean
    proteinG?: number
    carbsG?: number
    fatG?: number
    description?: string
    instructions?: string
    ingredients?: string[]
    samItems?: string[]
    htItems?: string[]
    imageUrl?: string | null
    sourceUrl?: string
  }
  alternateRecipes?: AlternateRecipe[]
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Failed to extract recipe'
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map(String).join('\n').trim()
  if (value == null) return ''
  return String(value).trim()
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean)
  }
  return []
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { url, mealType: requestedMealType } = body as { url?: string; mealType?: string }
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const [existing] = await db
    .select()
    .from(importedUrls)
    .where(eq(importedUrls.url, url))
    .limit(1)

  if (existing?.mealId) {
    const [meal] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, existing.mealId))
      .limit(1)
    if (meal) return NextResponse.json({ meal, cached: true })
  }

  const prompt = `Import a recipe for a family meal library from this URL: ${url}

Use web_search to:
1. Fetch and read the recipe page at the URL above.
2. Extract the primary recipe into a "meal" object.
3. Search for 2 alternate versions of the SAME dish from different reputable recipe websites (not the same URL).

For the meal object extract:
- name, emoji, tags (from ["high-protein","low-carb","balanced","vegetarian"]), isVeg
- proteinG, carbsG, fatG (per serving estimates)
- description (2-4 sentences), instructions (step-by-step cooking, 4-8 steps), ingredients (with amounts)
- samItems (bulk/Sam's Club), htItems (fresh/Harris Teeter)
- imageUrl: from the page's og:image meta tag when available (direct jpg/png/webp preferred)
- sourceUrl: "${url}"

For each entry in alternateRecipes (exactly 2):
- url: full recipe page URL on a different site
- imageUrl: og:image from that page when available
- siteName: og:site_name or a readable site name from the domain

Respond ONLY with valid JSON in this exact shape (no markdown):
{
  "meal": { ... },
  "alternateRecipes": [
    { "url": "...", "imageUrl": "...", "siteName": "..." },
    { "url": "...", "imageUrl": "...", "siteName": "..." }
  ]
}`

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      tools: WEB_SEARCH_TOOLS,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = extractTextFromMessage(message)
    if (!text.trim()) {
      return NextResponse.json({ error: 'Model returned an empty response' }, { status: 502 })
    }

    let extracted: ImportResponse
    try {
      extracted = parseJsonFromText<ImportResponse>(text)
    } catch (parseErr) {
      console.error('Import JSON parse error:', parseErr, text.slice(0, 500))
      return NextResponse.json({ error: 'Could not read recipe data from the page' }, { status: 502 })
    }

    const m = extracted.meal
    if (!m?.name?.trim()) {
      return NextResponse.json({ error: 'No recipe found at that URL' }, { status: 422 })
    }

    const mealType = normalizeMealType(requestedMealType)
    const description = asText(m.description)
    const instructions = asText(m.instructions)
    const ingredients = asStringList(m.ingredients)
    const samItems = asStringList(m.samItems)
    const htItems = asStringList(m.htItems)
    const imageUrl = m.imageUrl?.trim() || null
    const alternateRecipes = (extracted.alternateRecipes ?? []).slice(0, 2).map(alt => ({
      url: alt.url,
      imageUrl: alt.imageUrl?.trim() || null,
      siteName: alt.siteName || 'Recipe',
    }))

    const [meal] = await db
      .insert(meals)
      .values({
        name: m.name,
        emoji: m.emoji ?? '🍽',
        tags: m.tags ?? [],
        isVeg: m.isVeg ?? false,
        proteinG: m.proteinG ?? 0,
        carbsG: m.carbsG ?? 0,
        fatG: m.fatG ?? 0,
        description:
          description ||
          `Imported recipe for ${m.name}. Check the original link for full cooking instructions.`,
        instructions:
          instructions ||
          `See the original recipe for step-by-step instructions to make ${m.name}.`,
        ingredients: ingredients.length > 0 ? ingredients : [...samItems, ...htItems].filter(Boolean),
        samItems,
        htItems,
        sourceUrl: m.sourceUrl ?? url,
        imageUrl: imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : null,
        alternateRecipes: alternateRecipes.length ? alternateRecipes : null,
        mealType,
        aiGenerated: false,
      })
      .returning()

    await db
      .insert(importedUrls)
      .values({ url, mealId: meal.id, rawJson: extracted })
      .onConflictDoUpdate({
        target: importedUrls.url,
        set: { mealId: meal.id, rawJson: extracted },
      })

    return NextResponse.json({ meal })
  } catch (err) {
    console.error('Import error:', err)
    const message = errorMessage(err)
    const isAuth = message.includes('api_key') || message.includes('authentication')
    return NextResponse.json(
      {
        error: isAuth
          ? 'API key missing or invalid — check ANTHROPIC_API_KEY in .env'
          : message || 'Failed to extract recipe',
      },
      { status: isAuth ? 503 : 500 }
    )
  }
}
