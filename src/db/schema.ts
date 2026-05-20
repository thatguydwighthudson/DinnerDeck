import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  uuid,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  householdSize: integer('household_size').notNull().default(2),
  dietaryPreferences: text('dietary_preferences').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  table => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ]
)

export type User = typeof users.$inferSelect
export type Session = typeof sessions.$inferSelect

export const curatedRecipes = pgTable(
  'CuratedRecipe',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    sourceUrl: text('source_url').notNull(),
    mealType: text('meal_type').notNull().default('dinner'),
    tags: text('tags').array().notNull().default([]),
    isVeg: boolean('isVeg').notNull().default(false),
    emoji: text('emoji').notNull().default('🍽'),
    enriched: jsonb('enriched'),
    active: boolean('active').notNull().default(true),
    sortOrder: integer('sort_order'),
    curatorNotes: text('curator_notes').notNull().default(''),
    lastSuggestedAt: timestamp('last_suggested_at', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  table => [uniqueIndex('CuratedRecipe_source_url_key').on(table.sourceUrl)]
)

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
  notes: text('notes').notNull().default(''),
  servingSize: text('serving_size').notNull().default(''),
  servingWeight: text('serving_weight').notNull().default(''),
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
  catalogRecipeId: integer('catalog_recipe_id').references(() => curatedRecipes.id),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
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
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
})

export const weekPlans = pgTable(
  'WeekPlan',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
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
  table => [
    uniqueIndex('WeekPlan_user_week_day_mealType_key').on(
      table.userId,
      table.weekStart,
      table.dayOfWeek,
      table.mealType
    ),
    index('WeekPlan_user_id_idx').on(table.userId),
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
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
})

export const importedUrls = pgTable('ImportedUrl', {
  id: serial('id').primaryKey(),
  url: text('url').notNull().unique(),
  mealId: integer('mealId'),
  rawJson: jsonb('rawJson'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  meals: many(meals),
  weekPlans: many(weekPlans),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const curatedRecipesRelations = relations(curatedRecipes, ({ many }) => ({
  libraryMeals: many(meals),
}))

export const mealsRelations = relations(meals, ({ one, many }) => ({
  user: one(users, { fields: [meals.userId], references: [users.id] }),
  catalogRecipe: one(curatedRecipes, {
    fields: [meals.catalogRecipeId],
    references: [curatedRecipes.id],
  }),
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
