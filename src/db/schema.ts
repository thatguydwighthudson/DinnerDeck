import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const meals = pgTable('Meal', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('🍽'),
  tags: text('tags').array().notNull().default([]),
  isVeg: boolean('isVeg').notNull().default(false),
  isFavorite: boolean('isFavorite').notNull().default(false),
  proteinG: integer('proteinG').notNull().default(0),
  carbsG: integer('carbsG').notNull().default(0),
  fatG: integer('fatG').notNull().default(0),
  description: text('description').notNull().default(''),
  instructions: text('instructions').notNull().default(''),
  ingredients: text('ingredients').array().notNull().default([]),
  samItems: text('samItems').array().notNull().default([]),
  htItems: text('htItems').array().notNull().default([]),
  sourceUrl: text('source_url'),
  imageUrl: text('image_url'),
  alternateRecipes: jsonb('alternate_recipes'),
  mealType: text('meal_type').notNull().default('dinner'),
  aiGenerated: boolean('aiGenerated').notNull().default(false),
  deletedAt: timestamp('deletedAt', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
})

export const kidsMeals = pgTable('KidsMeal', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('🍽'),
  note: text('note').notNull().default(''),
  liked: boolean('liked').notNull().default(false),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
})

export const weekPlans = pgTable(
  'WeekPlan',
  {
    id: serial('id').primaryKey(),
    weekStart: timestamp('weekStart', { mode: 'date' }).notNull(),
    dayOfWeek: text('dayOfWeek').notNull(),
    mealType: text('meal_type').notNull().default('dinner'),
    isLeftover: boolean('isLeftover').notNull().default(false),
    isEatOut: boolean('is_eat_out').notNull().default(false),
    plannedMeal: jsonb('planned_meal'),
    servings: integer('servings').notNull().default(4),
    adultMealId: integer('adultMealId').references(() => meals.id),
    kidsMealId: integer('kidsMealId').references(() => kidsMeals.id),
    kidsAdultId: integer('kidsAdultId').references(() => meals.id),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('WeekPlan_weekStart_dayOfWeek_mealType_key').on(
      table.weekStart,
      table.dayOfWeek,
      table.mealType
    ),
  ]
)

export const mealHistory = pgTable('MealHistory', {
  id: serial('id').primaryKey(),
  mealId: integer('mealId')
    .notNull()
    .references(() => meals.id),
  cookedOn: timestamp('cookedOn', { mode: 'date' }).notNull(),
  weekStart: timestamp('weekStart', { mode: 'date' }).notNull(),
  dayOfWeek: text('dayOfWeek').notNull(),
  servings: integer('servings').notNull().default(4),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
})

export const importedUrls = pgTable('ImportedUrl', {
  id: serial('id').primaryKey(),
  url: text('url').notNull().unique(),
  mealId: integer('mealId'),
  rawJson: jsonb('rawJson'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
})

export const mealsRelations = relations(meals, ({ many }) => ({
  weekPlanAdult: many(weekPlans, { relationName: 'adultMeal' }),
  weekPlanKidsAdult: many(weekPlans, { relationName: 'kidsAdultMeal' }),
  history: many(mealHistory),
}))

export const kidsMealsRelations = relations(kidsMeals, ({ many }) => ({
  weekPlans: many(weekPlans),
}))

export const weekPlansRelations = relations(weekPlans, ({ one }) => ({
  adultMeal: one(meals, {
    fields: [weekPlans.adultMealId],
    references: [meals.id],
    relationName: 'adultMeal',
  }),
  kidsMeal: one(kidsMeals, {
    fields: [weekPlans.kidsMealId],
    references: [kidsMeals.id],
  }),
  kidsAdultMeal: one(meals, {
    fields: [weekPlans.kidsAdultId],
    references: [meals.id],
    relationName: 'kidsAdultMeal',
  }),
}))

export const mealHistoryRelations = relations(mealHistory, ({ one }) => ({
  meal: one(meals, {
    fields: [mealHistory.mealId],
    references: [meals.id],
  }),
}))
