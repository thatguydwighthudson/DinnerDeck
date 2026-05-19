import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { MEAL_TYPES, type MealType, mealTypePromptContext } from '@/lib/mealTypes'
import {
  CLAUDE_MODEL,
  WEB_SEARCH_TOOLS,
  extractTextFromMessage,
  parseJsonFromText,
} from '@/lib/anthropic'
import { normalizeMealSuggestion, type RawMealSuggestion } from '@/lib/normalizeMeal'

const client = new Anthropic()

const FAMILY_PREFS = `Family preferences (apply to every meal):
- High protein, low carb, but balanced overall
- Wife (Allyson) leans vegetarian but eats meat — at least 2 of the 5 meals should be vegetarian-friendly when suggesting dinners; for other meal types, include some vegetarian-friendly options where natural
- Two young kids who eat separately (not your concern here)
- They shop at Sam's Club (bulk) and Harris Teeter/Kroger (small quantities)
- Nothing too exotic or time-consuming`

function buildPrompt(mealType: MealType, existingMealNames: string[], favoriteMealNames: string[]) {
  const typeContext = mealTypePromptContext(mealType)
  return `You are a meal planning assistant for a family.

${FAMILY_PREFS}

${typeContext}

Existing meals in their library (do NOT suggest these again): ${existingMealNames.join(', ') || 'none yet'}
Their favorites for reference: ${favoriteMealNames.join(', ') || 'none yet'}

Use web_search for each dish to find:
1. A real recipe page URL (the primary source you based the meal on)
2. Up to 2 alternate recipe pages for the same dish on other reputable sites

Do not return image URLs — we display each meal with an emoji only. Pick a fitting single emoji per dish.

For each meal return a JSON object with ALL of these required fields:
- name: string (short, appealing)
- emoji: string (REQUIRED — one emoji that clearly represents the dish)
- tags: array of strings from ["high-protein", "low-carb", "balanced", "vegetarian"]
- isVeg: boolean
- proteinG: number (per serving, realistic)
- carbsG: number (per serving)
- fatG: number (per serving)
- description: string (REQUIRED — 2-3 full sentences about the dish; never empty)
- instructions: string (REQUIRED — numbered or step-by-step cooking directions, 4-8 clear steps for a weeknight)
- ingredients: array of strings (REQUIRED — 6-12 ingredients with amounts; never empty)
- sourceUrl: string (REQUIRED — full https URL to a real recipe page for this dish from web_search; not an image URL)
- alternateRecipes: array of up to 2 objects { url, siteName } for the SAME dish on different recipe sites (urls must differ from sourceUrl)
- samItems: array of strings (bulk at Sam's Club)
- htItems: array of strings (fresh/small at Harris Teeter)

Every meal MUST include sourceUrl, a non-empty description, non-empty instructions, at least 6 ingredients, and a distinct emoji.

Respond ONLY with a valid JSON array of 5 meal objects. No markdown, no explanation.`
}

function blockSummary(message: Anthropic.Message): string {
  return message.content
    .map((b: Anthropic.ContentBlock) => (b.type === 'text' ? `text(${b.text.length})` : b.type))
    .join(', ')
}

async function suggestForMealType(
  mealType: MealType,
  existingMealNames: string[],
  favoriteMealNames: string[]
) {
  const basePrompt = buildPrompt(mealType, existingMealNames, favoriteMealNames)
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt++) {
    const useWebSearch = attempt < 3
    const prompt = useWebSearch
      ? basePrompt
      : `${basePrompt}\n\nDo not use web search. Respond with ONLY a valid JSON array of exactly 5 meal objects. sourceUrl may be null only if truly unavailable.`
    try {
      const message = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        ...(useWebSearch ? { tools: WEB_SEARCH_TOOLS } : {}),
        messages: [{ role: 'user', content: prompt }],
      })

      const text = extractTextFromMessage(message)
      if (!text.trim()) {
        throw new Error(`Empty model text (${blockSummary(message)})`)
      }

      const suggestions = parseJsonFromText<RawMealSuggestion[]>(text)
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('Model returned an empty meal array')
      }

      return suggestions.map(normalizeMealSuggestion)
    } catch (err) {
      lastError = err
      console.warn(
        `Suggest ${mealType} attempt ${attempt}/3 failed${useWebSearch ? '' : ' (no web search)'}:`,
        err instanceof Error ? err.message : err
      )
    }
  }

  throw lastError ?? new Error('Failed to generate suggestions')
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    existingMealNames = [],
    favoriteMealNames = [],
    activeMealTypes = ['dinner'],
  } = body as {
    existingMealNames?: string[]
    favoriteMealNames?: string[]
    activeMealTypes?: string[]
  }

  const types = (activeMealTypes as MealType[]).filter(t => MEAL_TYPES.includes(t))
  if (!types.length) {
    return NextResponse.json({ error: 'No active meal types' }, { status: 400 })
  }

  try {
    const entries: [MealType, Awaited<ReturnType<typeof suggestForMealType>>][] = []
    for (const mealType of types) {
      const items = await suggestForMealType(mealType, existingMealNames, favoriteMealNames)
      entries.push([mealType, items])
    }

    const suggestions = Object.fromEntries(entries)
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('Suggest error:', err)
    const message = err instanceof Error ? err.message : 'Failed to generate suggestions'
    const isAuth = message.includes('api_key') || message.includes('authentication')
    return NextResponse.json(
      {
        error: isAuth
          ? 'API key missing or invalid — check ANTHROPIC_API_KEY in .env'
          : message || 'Failed to generate suggestions',
      },
      { status: isAuth ? 503 : 500 }
    )
  }
}
