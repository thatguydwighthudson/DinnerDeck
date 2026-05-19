import type { GroupedSuggestions } from '@/lib/types'

const prefix = 'dinnerdeck-week-suggestions'

export function suggestionsStorageKey(weekStart: string) {
  return `${prefix}-${weekStart.slice(0, 10)}`
}

export function loadWeekSuggestions(weekStart: string): GroupedSuggestions | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(suggestionsStorageKey(weekStart))
    return raw ? (JSON.parse(raw) as GroupedSuggestions) : null
  } catch {
    return null
  }
}

export function saveWeekSuggestions(weekStart: string, suggestions: GroupedSuggestions) {
  localStorage.setItem(suggestionsStorageKey(weekStart), JSON.stringify(suggestions))
}

export function clearWeekSuggestions(weekStart: string) {
  localStorage.removeItem(suggestionsStorageKey(weekStart))
}
