import Anthropic from '@anthropic-ai/sdk'
import {
  CLAUDE_MODEL,
  WEB_SEARCH_TOOLS,
  extractTextFromMessage,
  parseJsonFromText,
} from '@/lib/anthropic'

const client = new Anthropic()

/** Use Claude + web search to find a direct food image URL for a dish name. */
export async function findMealImageUrl(mealName: string): Promise<string | null> {
  const prompt = `Find one high-quality food photo for the dish: "${mealName}".

Use web_search. Prefer a direct image URL (jpg, png, or webp) from a reputable recipe or food site.

Respond ONLY with JSON: { "imageUrl": "https://..." } or { "imageUrl": null } if none found.`

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    tools: WEB_SEARCH_TOOLS,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = extractTextFromMessage(message)
  const parsed = parseJsonFromText<{ imageUrl?: string | null }>(text)
  const url = parsed.imageUrl?.trim()
  if (!url) return null
  return /^https?:\/\//i.test(url) ? url : null
}
