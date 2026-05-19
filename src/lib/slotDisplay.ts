import type { DayPlan, Meal, PlannedMeal } from '@/lib/types'

export function getPlannedMeal(plan: DayPlan): PlannedMeal | null {
  if (!plan.plannedMeal || typeof plan.plannedMeal !== 'object') return null
  return plan.plannedMeal as PlannedMeal
}

export function resolveSlotMeal(plan: DayPlan, meals: Meal[]): Meal | PlannedMeal | null {
  if (plan.isEatOut || plan.isLeftover) return null
  if (plan.adultMeal) return plan.adultMeal
  if (plan.adultMealId) return meals.find(m => m.id === plan.adultMealId) ?? null
  return getPlannedMeal(plan)
}

export function slotTitle(plan: DayPlan, meals: Meal[]): string | null {
  if (plan.isEatOut) return 'Eat out'
  if (plan.isLeftover) return 'Leftovers'
  const meal = resolveSlotMeal(plan, meals)
  return meal?.name ?? null
}

export function slotEmoji(plan: DayPlan, meals: Meal[]): string {
  if (plan.isEatOut) return '🍽'
  if (plan.isLeftover) return '↩'
  const meal = resolveSlotMeal(plan, meals)
  return meal?.emoji ?? '·'
}

export function slotImageUrl(plan: DayPlan, meals: Meal[]): string | null {
  if (plan.isEatOut || plan.isLeftover) return null
  const meal = resolveSlotMeal(plan, meals)
  return meal?.imageUrl ?? null
}

export function slotIsFilled(plan: DayPlan): boolean {
  return Boolean(plan.isEatOut || plan.isLeftover || plan.adultMealId || getPlannedMeal(plan))
}
