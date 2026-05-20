import { DAYS, type DayOfWeek } from '@/lib/types'
import type { DayPlan } from '@/lib/types'

export const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner', 'dessert'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
  dessert: 'Dessert',
}

export const DEFAULT_DAY_MEAL_TYPES: MealType[] = ['dinner']

const DAY_MEAL_TYPES_KEY = 'dinnerdeck-day-meal-types'
const LEGACY_ACTIVE_KEY = 'dinnerdeck-active-meal-types'

export type DayMealTypesState = Partial<Record<DayOfWeek, MealType[]>>

function sortMealTypes(types: MealType[]): MealType[] {
  return MEAL_TYPES.filter(t => types.includes(t))
}

function ensureDinner(types: MealType[]): MealType[] {
  const set = new Set(types)
  set.add('dinner')
  return sortMealTypes([...set])
}

function migrateLegacyActiveTypes(): DayMealTypesState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LEGACY_ACTIVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as string[]
    const valid = parsed.filter((t): t is MealType => MEAL_TYPES.includes(t as MealType))
    if (!valid.length || (valid.length === 1 && valid[0] === 'dinner')) return null
    const perDay = ensureDinner(valid)
    const state: DayMealTypesState = {}
    for (const day of DAYS) state[day] = perDay
    localStorage.removeItem(LEGACY_ACTIVE_KEY)
    return state
  } catch {
    return null
  }
}

export function loadDayMealTypesState(): DayMealTypesState {
  if (typeof window === 'undefined') return {}
  const migrated = migrateLegacyActiveTypes()
  if (migrated) {
    saveDayMealTypesState(migrated)
    return migrated
  }
  try {
    const raw = localStorage.getItem(DAY_MEAL_TYPES_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as DayMealTypesState
  } catch {
    return {}
  }
}

export function saveDayMealTypesState(state: DayMealTypesState) {
  localStorage.setItem(DAY_MEAL_TYPES_KEY, JSON.stringify(state))
}

/** Meal types shown when planning a day (dinner always; extras are per-day). */
export function getMealTypesForDay(
  day: DayOfWeek,
  state: DayMealTypesState,
  weekPlan: DayPlan[] = []
): MealType[] {
  const fromState = ensureDinner(state[day] ?? DEFAULT_DAY_MEAL_TYPES)
  const fromPlan = weekPlan
    .filter(p => p.dayOfWeek === day)
    .map(p => normalizeMealType(p.mealType))
  return ensureDinner([...fromState, ...fromPlan])
}

export function addMealTypeToDay(
  day: DayOfWeek,
  mealType: MealType,
  state: DayMealTypesState
): DayMealTypesState {
  if (mealType === 'dinner') return state
  const current = getMealTypesForDay(day, state)
  if (current.includes(mealType)) return state
  return { ...state, [day]: sortMealTypes([...current, mealType]) }
}

export function mealTypesAvailableToAdd(day: DayOfWeek, state: DayMealTypesState, weekPlan: DayPlan[]): MealType[] {
  const current = new Set(getMealTypesForDay(day, state, weekPlan))
  return MEAL_TYPES.filter(t => t !== 'dinner' && !current.has(t))
}

export function normalizeMealType(value: string | null | undefined): MealType {
  if (value && MEAL_TYPES.includes(value as MealType)) return value as MealType
  return 'dinner'
}

export function groupMealsByType<T extends { mealType?: string | null }>(
  items: T[],
  order: readonly MealType[] = MEAL_TYPES
): { mealType: MealType; meals: T[] }[] {
  const byType = new Map<MealType, T[]>()
  for (const item of items) {
    const t = normalizeMealType(item.mealType)
    const list = byType.get(t) ?? []
    list.push(item)
    byType.set(t, list)
  }
  return order
    .filter(t => (byType.get(t)?.length ?? 0) > 0)
    .map(mealType => ({ mealType, meals: byType.get(mealType)! }))
}

export function mealTypeSuggestPrompt(mealType: MealType, count = 3): string {
  switch (mealType) {
    case 'breakfast':
      return `Suggest exactly ${count} NEW breakfast meals — morning foods like eggs, oatmeal, smoothies, pancakes, yogurt bowls, etc. Keep them quick and realistic for busy weekday mornings.`
    case 'lunch':
      return `Suggest exactly ${count} NEW lunch meals — midday meals like salads, wraps, grain bowls, soups, sandwiches, etc. Suitable for home or packed lunch.`
    case 'snack':
      return `Suggest exactly ${count} NEW snack ideas — light bites like nuts, fruit with dip, cheese and crackers, energy bites, veggie sticks with hummus, etc. Not full meals.`
    case 'dessert':
      return `Suggest exactly ${count} NEW dessert ideas — treats like fruit crisps, chocolate mousse, cookies, nice cream, pudding, etc. Healthier options preferred but still satisfying.`
    case 'dinner':
    default:
      return `Suggest exactly ${count} NEW dinner meals — healthy, realistic weeknight dinners. Nothing too exotic or time-consuming.`
  }
}

/** @deprecated Use mealTypeSuggestPrompt */
export function mealTypePromptContext(mealType: MealType): string {
  return mealTypeSuggestPrompt(mealType, 5)
}

export function suggestIdeasLabel(mealType: MealType): string {
  const label = MEAL_TYPE_LABELS[mealType].toLowerCase()
  return mealType === 'snack' ? 'Suggest snack ideas' : `Suggest ${label} ideas`
}

export const MEAL_TYPES_WITH_IDEAS_SUGGEST = ['breakfast', 'lunch', 'snack', 'dessert'] as const
export type MealTypeWithIdeasSuggest = (typeof MEAL_TYPES_WITH_IDEAS_SUGGEST)[number]

export function supportsMealTypeIdeasSuggest(mealType: MealType): mealType is MealTypeWithIdeasSuggest {
  return (MEAL_TYPES_WITH_IDEAS_SUGGEST as readonly MealType[]).includes(mealType)
}
