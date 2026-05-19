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

Use web_search to find a real, publicly accessible food photo for each dish before you finalize your answer.

For each meal return a JSON object with ALL of these required fields:
- name: string (short, appealing)
- emoji: string (single emoji that represents the dish)
- tags: array of strings from ["high-protein", "low-carb", "balanced", "vegetarian"]
- isVeg: boolean
- proteinG: number (per serving, realistic)
- carbsG: number (per serving)
- fatG: number (per serving)
- description: string (REQUIRED — 2-3 full sentences about the dish; never empty)
- instructions: string (REQUIRED — numbered or step-by-step cooking directions, 4-8 clear steps for a weeknight)
- ingredients: array of strings (REQUIRED — 6-12 ingredients with amounts; never empty)
- alternateRecipes: optional array of up to 2 objects { url, imageUrl, siteName } for the same dish on other recipe sites
- samItems: array of strings (bulk at Sam's Club)
- htItems: array of strings (fresh/small at Harris Teeter)
- imageUrl: string or null (direct image URL — jpg, png, or webp — from web_search; null only if truly unavailable)

Every meal MUST include a non-empty description, non-empty instructions, at least 6 ingredients, and imageUrl whenever possible.

Respond ONLY with a valid JSON array of 5 meal objects. No markdown, no explanation.`
}

async function suggestForMealType(
  mealType: MealType,
  existingMealNames: string[],
  favoriteMealNames: string[]
) {
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    tools: WEB_SEARCH_TOOLS,
    messages: [{ role: 'user', content: buildPrompt(mealType, existingMealNames, favoriteMealNames) }],
  })

  const text = extractTextFromMessage(message)
  const suggestions = parseJsonFromText<RawMealSuggestion[]>(text)
  return suggestions.map(normalizeMealSuggestion)
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
    const entries = await Promise.all(
      types.map(async mealType => {
        const items = await suggestForMealType(mealType, existingMealNames, favoriteMealNames)
        return [mealType, items] as const
      })
    )

    const suggestions = Object.fromEntries(entries)
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('Suggest error:', err)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
