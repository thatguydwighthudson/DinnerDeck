import Anthropic from '@anthropic-ai/sdk'
import {
  CLAUDE_MODEL,
  WEB_SEARCH_TOOLS,
  extractTextFromMessage,
  parseJsonFromText,
} from '@/lib/anthropic'

const client = new Anthropic()

export type ImportedRecipeMeal = {
  name: string
  emoji?: string
  tags?: string[]
  isVeg?: boolean
  proteinG?: number
  carbsG?: number
  fatG?: number
  notes?: string
  servingSize?: string
  servingWeight?: string
  description?: string
  instructions?: string
  ingredients?: string[]
  samItems?: string[]
  htItems?: string[]
  sourceUrl?: string
  imageUrl?: string | null
}

type ImportResponse = { meal: ImportedRecipeMeal }

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

/** Payload stored in CuratedRecipe.enriched (and used when copying to Meal). */
export type EnrichedRecipePayload = {
  name: string
  emoji: string
  tags: string[]
  isVeg: boolean
  proteinG: number
  carbsG: number
  fatG: number
  notes: string
  servingSize: string
  servingWeight: string
  description: string
  instructions: string
  ingredients: string[]
  samItems: string[]
  htItems: string[]
  imageUrl: string | null
  sourceUrl: string
}

export function buildEnrichedPayload(
  m: ImportedRecipeMeal,
  url: string,
  defaults?: { name?: string; emoji?: string; tags?: string[]; isVeg?: boolean }
): EnrichedRecipePayload {
  const description = asText(m.description)
  const instructions = asText(m.instructions)
  const ingredients = asStringList(m.ingredients)
  const samItems = asStringList(m.samItems)
  const htItems = asStringList(m.htItems)
  const name = (m.name?.trim() || defaults?.name || '').trim()

  return {
    name,
    emoji: m.emoji ?? defaults?.emoji ?? '🍽',
    tags: m.tags?.length ? m.tags : (defaults?.tags ?? []),
    isVeg: m.isVeg ?? defaults?.isVeg ?? false,
    proteinG: m.proteinG ?? 0,
    carbsG: m.carbsG ?? 0,
    fatG: m.fatG ?? 0,
    notes: asText(m.notes),
    servingSize: asText(m.servingSize),
    servingWeight: asText(m.servingWeight),
    description:
      description ||
      `Imported recipe for ${name}. Check the original link for full cooking instructions.`,
    instructions:
      instructions ||
      `See the original recipe for step-by-step instructions to make ${name}.`,
    ingredients: ingredients.length > 0 ? ingredients : [...samItems, ...htItems].filter(Boolean),
    samItems,
    htItems,
    imageUrl: m.imageUrl?.trim() || null,
    sourceUrl: m.sourceUrl?.trim() || url,
  }
}

export async function importRecipeFromUrl(
  url: string,
  householdContext?: string
): Promise<ImportedRecipeMeal> {
  const contextLine = householdContext ? `${householdContext}\n\n` : ''
  const prompt = `${contextLine}Import a recipe for a family meal library from this URL: ${url}

Use web_search to fetch and read the recipe page at the URL above.
Extract the primary recipe into a "meal" object with:
- name, emoji, tags (from ["high-protein","low-carb","balanced","vegetarian"]), isVeg
- proteinG, carbsG, fatG (per serving estimates)
- servingSize: yield from the recipe (e.g. "6 servings" or "4 bowls")
- servingWeight: optional per-serving weight if stated or reasonably estimable (e.g. "~280g per serving")
- notes: optional prep tips or caveats from the page (empty string if none)
- description (2-4 sentences), instructions (step-by-step cooking, 4-8 steps), ingredients (with amounts and weights where listed)
- samItems (bulk/Sam's Club), htItems (fresh/Harris Teeter)
- sourceUrl: "${url}"

Respond ONLY with valid JSON in this exact shape (no markdown):
{
  "meal": { ... }
}`

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    tools: WEB_SEARCH_TOOLS,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = extractTextFromMessage(message)
  if (!text.trim()) {
    throw new Error('Model returned an empty response')
  }

  let extracted: ImportResponse
  try {
    extracted = parseJsonFromText<ImportResponse>(text)
  } catch {
    throw new Error('Could not parse recipe JSON from model response')
  }

  const meal = extracted.meal
  if (!meal?.name?.trim()) {
    throw new Error('No recipe name found at that URL')
  }

  return meal
}
