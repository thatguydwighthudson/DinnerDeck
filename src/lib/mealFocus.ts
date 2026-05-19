export const MEAL_FOCUS_PRESETS = [
  { id: 'high-protein', label: 'High protein' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'low-carb', label: 'Low carb' },
  { id: 'balanced', label: 'Balanced' },
] as const

export type MealFocusPresetId = (typeof MEAL_FOCUS_PRESETS)[number]['id']

export type MealFocusPrefs = {
  presets: MealFocusPresetId[]
  custom: string
}

const STORAGE_KEY = 'dinnerdeck-meal-focus'

export const DEFAULT_MEAL_FOCUS: MealFocusPrefs = {
  presets: ['high-protein', 'balanced'],
  custom: '',
}

export function loadMealFocus(): MealFocusPrefs {
  if (typeof window === 'undefined') return { ...DEFAULT_MEAL_FOCUS, presets: [...DEFAULT_MEAL_FOCUS.presets] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_MEAL_FOCUS, presets: [...DEFAULT_MEAL_FOCUS.presets] }
    const parsed = JSON.parse(raw) as Partial<MealFocusPrefs>
    const validIds = new Set(MEAL_FOCUS_PRESETS.map(p => p.id))
    const presets = (parsed.presets ?? []).filter((id): id is MealFocusPresetId =>
      validIds.has(id as MealFocusPresetId)
    )
    return {
      presets,
      custom: typeof parsed.custom === 'string' ? parsed.custom.trim() : '',
    }
  } catch {
    return { ...DEFAULT_MEAL_FOCUS, presets: [...DEFAULT_MEAL_FOCUS.presets] }
  }
}

export function saveMealFocus(prefs: MealFocusPrefs) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      presets: prefs.presets,
      custom: prefs.custom.trim(),
    })
  )
}

export function buildMealFocusPrompt(prefs: MealFocusPrefs): string {
  const lines: string[] = []
  if (prefs.presets.length) {
    const labels = prefs.presets
      .map(id => MEAL_FOCUS_PRESETS.find(p => p.id === id)?.label ?? id)
      .join(', ')
    lines.push(`This week's focus (prioritize these across all suggested meals): ${labels}.`)
  }
  if (prefs.custom) {
    lines.push(`Additional focus from the family: ${prefs.custom}`)
  }
  if (!lines.length) return ''
  return lines.join('\n')
}
