import Anthropic from '@anthropic-ai/sdk'

/** Anthropic server-side web search (types vary by SDK version). */
export const WEB_SEARCH_TOOLS = [
  { type: 'web_search_20250305', name: 'web_search' },
] as unknown as Anthropic.Messages.MessageCreateParams['tools']

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

export function extractTextFromMessage(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n')
}

export function parseJsonFromText<T>(raw: string): T {
  const stripped = raw.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(stripped) as T
  } catch {
    const objectMatch = stripped.match(/\{[\s\S]*\}/)
    if (objectMatch) return JSON.parse(objectMatch[0]) as T
    const arrayMatch = stripped.match(/\[[\s\S]*\]/)
    if (arrayMatch) return JSON.parse(arrayMatch[0]) as T
    throw new Error('No JSON found in model response')
  }
}
