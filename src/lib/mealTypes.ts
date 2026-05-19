export const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner', 'dessert'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
  dessert: 'Dessert',
}

export const DEFAULT_ACTIVE_MEAL_TYPES: MealType[] = ['dinner']

const STORAGE_KEY = 'dinnerdeck-active-meal-types'

export function loadActiveMealTypes(): MealType[] {
  if (typeof window === 'undefined') return [...DEFAULT_ACTIVE_MEAL_TYPES]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...DEFAULT_ACTIVE_MEAL_TYPES]
    const parsed = JSON.parse(raw) as string[]
    const valid = parsed.filter((t): t is MealType => MEAL_TYPES.includes(t as MealType))
    if (!valid.includes('dinner')) valid.unshift('dinner')
    return valid.length ? valid : [...DEFAULT_ACTIVE_MEAL_TYPES]
  } catch {
    return [...DEFAULT_ACTIVE_MEAL_TYPES]
  }
}

export function saveActiveMealTypes(types: MealType[]) {
  const withDinner = types.includes('dinner') ? types : (['dinner', ...types] as MealType[])
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withDinner))
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

export function mealTypePromptContext(mealType: MealType): string {
  switch (mealType) {
    case 'breakfast':
      return 'Suggest exactly 5 NEW breakfast meals — morning foods like eggs, oatmeal, smoothies, pancakes, yogurt bowls, etc. Keep them quick and realistic for busy weekday mornings.'
    case 'lunch':
      return 'Suggest exactly 5 NEW lunch meals — midday meals like salads, wraps, grain bowls, soups, sandwiches, etc. Suitable for home or packed lunch.'
    case 'snack':
      return 'Suggest exactly 5 NEW snack ideas — light bites like nuts, fruit with dip, cheese and crackers, energy bites, veggie sticks with hummus, etc. Not full meals.'
    case 'dessert':
      return 'Suggest exactly 5 NEW dessert ideas — treats like fruit crisps, chocolate mousse, cookies, nice cream, pudding, etc. Healthier options preferred but still satisfying.'
    case 'dinner':
    default:
      return 'Suggest exactly 5 NEW dinner meals — healthy, realistic weeknight dinners. Nothing too exotic or time-consuming.'
  }
}
