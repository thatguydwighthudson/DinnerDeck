import type { DayPlan, Meal, PlannedMeal } from '@/lib/types'
import { resolveSlotMeal } from '@/lib/slotDisplay'

export type MacroTotals = {
  proteinG: number
  carbsG: number
  fatG: number
  calories: number
  mealCount: number
}

export function macrosFromMeal(meal: Meal | PlannedMeal | null | undefined): MacroTotals {
  if (!meal) {
    return { proteinG: 0, carbsG: 0, fatG: 0, calories: 0, mealCount: 0 }
  }
  const proteinG = meal.proteinG ?? 0
  const carbsG = meal.carbsG ?? 0
  const fatG = meal.fatG ?? 0
  return {
    proteinG,
    carbsG,
    fatG,
    calories: Math.round(proteinG * 4 + carbsG * 4 + fatG * 9),
    mealCount: 1,
  }
}

export function addMacroTotals(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fatG: a.fatG + b.fatG,
    calories: a.calories + b.calories,
    mealCount: a.mealCount + b.mealCount,
  }
}

const emptyTotals: MacroTotals = { proteinG: 0, carbsG: 0, fatG: 0, calories: 0, mealCount: 0 }

export function sumDayMacros(day: string, weekPlan: DayPlan[], meals: Meal[]): MacroTotals {
  return weekPlan
    .filter(p => p.dayOfWeek === day)
    .reduce((acc, plan) => {
      const slotMeal = resolveSlotMeal(plan, meals)
      if (!slotMeal) return acc
      return addMacroTotals(acc, macrosFromMeal(slotMeal))
    }, emptyTotals)
}

export function sumWeekMacros(weekPlan: DayPlan[], meals: Meal[]): MacroTotals {
  return weekPlan.reduce((acc, plan) => {
    const slotMeal = resolveSlotMeal(plan, meals)
    if (!slotMeal) return acc
    return addMacroTotals(acc, macrosFromMeal(slotMeal))
  }, emptyTotals)
}

export function formatMacroLine(totals: MacroTotals): string {
  if (totals.mealCount === 0) {
    return 'No meals with macros planned yet'
  }
  return `${totals.proteinG}g protein · ${totals.carbsG}g carbs · ${totals.fatG}g fat · ~${totals.calories} kcal`
}
