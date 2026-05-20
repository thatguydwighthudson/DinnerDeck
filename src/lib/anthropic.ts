import Anthropic from '@anthropic-ai/sdk'

/** Anthropic server-side web search (types vary by SDK version). */
export const WEB_SEARCH_TOOLS = [
  { type: 'web_search_20250305', name: 'web_search' },
] as unknown as Anthropic.Messages.MessageCreateParams['tools']

/** Fast model for meal suggestions and lighter tasks. */
export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

export function extractTextFromMessage(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n')
}

/** First balanced `{...}` or `[...]` slice (avoids greedy-regex trailing junk). */
export function extractFirstJsonSubstring(raw: string): string | null {
  const stripped = raw.replace(/```json|```/gi, '').trim()
  const objStart = stripped.indexOf('{')
  const arrStart = stripped.indexOf('[')
  let start = -1
  let openChar = ''
  let closeChar = ''
  if (objStart >= 0 && (arrStart < 0 || objStart <= arrStart)) {
    start = objStart
    openChar = '{'
    closeChar = '}'
  } else if (arrStart >= 0) {
    start = arrStart
    openChar = '['
    closeChar = ']'
  }
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i]
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === openChar) depth++
    if (ch === closeChar) {
      depth--
      if (depth === 0) return stripped.slice(start, i + 1)
    }
  }
  return null
}

export function parseJsonFromText<T>(raw: string): T {
  const stripped = raw.replace(/```json|```/gi, '').trim()
  try {
    return JSON.parse(stripped) as T
  } catch {
    const slice = extractFirstJsonSubstring(raw)
    if (!slice) throw new Error('No JSON found in model response')
    return JSON.parse(slice) as T
  }
}

export function truncateMealNames(names: string[], limit = 10): string[] {
  return names.filter(Boolean).slice(-limit)
}
