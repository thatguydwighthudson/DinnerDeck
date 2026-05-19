import type { MealType } from '@/lib/mealTypes'

export type AlternateRecipe = {
  url: string
  imageUrl: string | null
  siteName: string
}

export type PlannedMeal = {
  name: string
  emoji: string
  tags: string[]
  isVeg: boolean
  proteinG: number
  carbsG: number
  fatG: number
  notes?: string
  servingSize?: string
  servingWeight?: string
  description: string
  instructions: string
  ingredients: string[]
  samItems: string[]
  htItems: string[]
  imageUrl?: string | null
  sourceUrl?: string | null
  alternateRecipes?: AlternateRecipe[] | null
}

export type Meal = PlannedMeal & {
  id: number
  mealType?: MealType
  isFavorite: boolean
  aiGenerated: boolean
  createdAt: string
}

export type MealSuggestion = PlannedMeal & {
  mealType?: MealType
  aiGenerated?: boolean
}

export type GroupedSuggestions = Partial<Record<MealType, MealSuggestion[]>>

export type KidsMeal = {
  id: number
  name: string
  emoji: string
  note: string
  liked: boolean
  createdAt: string
}

export type DayPlan = {
  id?: number | null
  weekStart: string
  dayOfWeek: string
  mealType: string
  isLeftover: boolean
  isEatOut?: boolean
  servings: number
  adultMealId: number | null
  kidsMealId: number | null
  plannedMeal?: PlannedMeal | null
  adultMeal?: Meal | null
  kidsMeal?: KidsMeal | null
}

export type MealHistory = {
  id: number
  mealId: number
  meal: Meal
  cookedOn: string
  weekStart: string
  dayOfWeek: string
  servings: number
  notes: string
}

/** Sunday through Saturday */
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export type DayOfWeek = (typeof DAYS)[number]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
}

/** Week starts on Sunday (local time). */
export function getWeekStart(date = new Date()): string {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
