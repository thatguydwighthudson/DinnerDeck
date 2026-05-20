export type SafeUser = {
  id: string
  name: string
  email: string
  householdSize: number
  dietaryPreferences: string[]
}

export function toSafeUser(user: {
  id: string
  name: string
  email: string
  householdSize: number
  dietaryPreferences: string[] | null
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    householdSize: user.householdSize,
    dietaryPreferences: user.dietaryPreferences ?? [],
  }
}

export function userMealPlanContext(user: SafeUser): string {
  const prefs = user.dietaryPreferences.length
    ? user.dietaryPreferences.join(', ')
    : 'none'
  return `This meal plan is for ${user.name}'s household of ${user.householdSize} people with the following dietary preferences: ${prefs}.`
}

export function timeGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}`
  if (h < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

export function userInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}
