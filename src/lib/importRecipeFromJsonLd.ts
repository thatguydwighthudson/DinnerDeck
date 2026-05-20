import type { ImportedRecipeMeal } from '@/lib/importRecipeFromUrl'

export const IMPORT_RECIPE_UNSUPPORTED_MESSAGE =
  "Couldn't add this recipe — we couldn't find structured recipe data on that page. Try another link or add it manually."

const FETCH_TIMEOUT_MS = 15_000
const MAX_HTML_BYTES = 2 * 1024 * 1024
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (compatible; DinnerDeck/1.0; +https://github.com/local/dinnerdeck)'

type JsonLdObject = Record<string, unknown>

function isRecipeType(type: unknown): boolean {
  if (typeof type === 'string') {
    return type === 'Recipe' || type.endsWith('/Recipe')
  }
  if (Array.isArray(type)) return type.some(isRecipeType)
  return false
}

function collectRecipeNodes(data: unknown, out: JsonLdObject[] = []): JsonLdObject[] {
  if (data == null) return out
  if (Array.isArray(data)) {
    for (const item of data) collectRecipeNodes(item, out)
    return out
  }
  if (typeof data !== 'object') return out

  const obj = data as JsonLdObject
  if (isRecipeType(obj['@type'])) out.push(obj)

  for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage'] as const) {
    if (key in obj) collectRecipeNodes(obj[key], out)
  }

  return out
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = []
  const pattern =
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

  let match: RegExpExecArray | null
  while ((match = pattern.exec(html)) !== null) {
    const raw = match[1].trim()
    if (!raw) continue
    try {
      blocks.push(JSON.parse(raw))
    } catch {
      // skip malformed blocks
    }
  }
  return blocks
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  if (value == null) return ''
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return asText((value as { text?: unknown }).text)
  }
  return ''
}

function parseIngredient(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (value == null) return ''
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const name = asText(obj.name)
    if (name) return name
    return asText(obj.description)
  }
  return String(value).trim()
}

function parseIngredients(value: unknown): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return list.map(parseIngredient).filter(Boolean)
}

function parseInstructions(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()

  const steps: string[] = []
  const list = Array.isArray(value) ? value : [value]
  for (const item of list) {
    if (typeof item === 'string') {
      const s = item.trim()
      if (s) steps.push(s)
      continue
    }
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>
      const text = asText(obj.text) || asText(obj.name) || asText(obj.description)
      if (text) steps.push(text)
    }
  }
  return steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
}

function parseYield(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim()
  if (Array.isArray(value)) return value.map(String).join(', ').trim()
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return asText(obj.name) || asText(obj.description)
  }
  return ''
}

function parseImageUrl(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value.trim() || undefined
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = parseImageUrl(item)
      if (url) return url
    }
    return undefined
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const url = asText(obj.url) || asText(obj.contentUrl)
    return url || undefined
  }
  return undefined
}

function parseNutritionGrams(value: unknown): number | undefined {
  const text = asText(value)
  if (!text) return undefined
  const match = text.match(/([\d.]+)/)
  if (!match) return undefined
  const n = parseFloat(match[1])
  return Number.isFinite(n) ? Math.round(n) : undefined
}

function inferVeg(recipe: JsonLdObject, ingredients: string[]): boolean {
  const diets = recipe.suitableForDiet
  const dietList = Array.isArray(diets) ? diets : diets ? [diets] : []
  for (const diet of dietList) {
    const s = String(diet).toLowerCase()
    if (s.includes('vegetarian') || s.includes('vegan')) return true
  }
  const hay = ingredients.join(' ').toLowerCase()
  return /\b(tofu|tempeh|lentil|chickpea|black bean|kidney bean)\b/.test(hay)
}

function recipeScore(recipe: JsonLdObject): number {
  const name = asText(recipe.name)
  const ingredients = parseIngredients(recipe.recipeIngredient)
  const instructions = parseInstructions(recipe.recipeInstructions)
  let score = 0
  if (name) score += 10
  score += Math.min(ingredients.length, 20)
  if (instructions.length > 20) score += 15
  if (asText(recipe.description)) score += 3
  return score
}

function mapRecipeToMeal(recipe: JsonLdObject, url: string): ImportedRecipeMeal {
  const name = asText(recipe.name)
  const ingredients = parseIngredients(recipe.recipeIngredient)
  const instructions = parseInstructions(recipe.recipeInstructions)
  const description = asText(recipe.description)
  const nutrition =
    recipe.nutrition && typeof recipe.nutrition === 'object'
      ? (recipe.nutrition as Record<string, unknown>)
      : null

  return {
    name,
    description: description || undefined,
    instructions: instructions || undefined,
    ingredients,
    servingSize: parseYield(recipe.recipeYield) || undefined,
    proteinG: nutrition ? parseNutritionGrams(nutrition.proteinContent) : undefined,
    carbsG: nutrition ? parseNutritionGrams(nutrition.carbohydrateContent) : undefined,
    fatG: nutrition ? parseNutritionGrams(nutrition.fatContent) : undefined,
    isVeg: inferVeg(recipe, ingredients),
    imageUrl: parseImageUrl(recipe.image),
    sourceUrl: url,
  }
}

function pickBestRecipe(nodes: JsonLdObject[]): JsonLdObject | null {
  if (!nodes.length) return null
  return [...nodes].sort((a, b) => recipeScore(b) - recipeScore(a))[0] ?? null
}

function validateImported(meal: ImportedRecipeMeal): void {
  if (!meal.name?.trim()) {
    throw new Error(IMPORT_RECIPE_UNSUPPORTED_MESSAGE)
  }
  const hasIngredients = (meal.ingredients?.length ?? 0) > 0
  const hasInstructions = (meal.instructions?.trim().length ?? 0) > 0
  if (!hasIngredients && !hasInstructions) {
    throw new Error(IMPORT_RECIPE_UNSUPPORTED_MESSAGE)
  }
}

export async function fetchRecipePageHtml(url: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Enter a valid recipe URL')
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Recipe URL must start with http:// or https://')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': BROWSER_USER_AGENT,
      },
      redirect: 'follow',
    })

    if (!res.ok) {
      throw new Error(`Couldn't reach that page (HTTP ${res.status})`)
    }

    const contentLength = res.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_HTML_BYTES) {
      throw new Error('That page is too large to import')
    }

    const reader = res.body?.getReader()
    if (!reader) {
      return await res.text()
    }

    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_HTML_BYTES) {
        throw new Error('That page is too large to import')
      }
      chunks.push(value)
    }

    const combined = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      combined.set(chunk, offset)
      offset += chunk.byteLength
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(combined)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error("Couldn't reach that page — request timed out")
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

export function parseRecipeFromHtml(html: string, url: string): ImportedRecipeMeal {
  const blocks = extractJsonLdBlocks(html)
  const recipes: JsonLdObject[] = []
  for (const block of blocks) {
    collectRecipeNodes(block, recipes)
  }

  const best = pickBestRecipe(recipes)
  if (!best) {
    throw new Error(IMPORT_RECIPE_UNSUPPORTED_MESSAGE)
  }

  const meal = mapRecipeToMeal(best, url)
  validateImported(meal)
  return meal
}

export async function importRecipeFromJsonLd(url: string): Promise<ImportedRecipeMeal> {
  const html = await fetchRecipePageHtml(url)
  return parseRecipeFromHtml(html, url)
}
