'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Meal,
  KidsMeal,
  DayPlan,
  MealHistory,
  GroupedSuggestions,
  MealSuggestion,
  PlannedMeal,
  getWeekStart,
  type DayOfWeek,
} from '@/lib/types'
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  addMealTypeToDay,
  getMealTypesForDay,
  groupMealsByType,
  loadDayMealTypesState,
  mealTypesAvailableToAdd,
  normalizeMealType,
  saveDayMealTypesState,
  supportsMealTypeIdeasSuggest,
  type DayMealTypesState,
  type MealType,
} from '@/lib/mealTypes'
import BrandMark from '@/components/BrandMark'
import {
  MEAL_FOCUS_PRESETS,
  loadMealFocus,
  saveMealFocus,
  type MealFocusPrefs,
  type MealFocusPresetId,
} from '@/lib/mealFocus'
import { clearWeekSuggestions } from '@/lib/weekSuggestions'
import MealDetailModal from '@/components/MealDetailModal'
import KidsPickerSheet from '@/components/KidsPickerSheet'
import WeekOverview from '@/components/WeekOverview'
import DayPlanScreen from '@/components/DayPlanScreen'
import MealTypePickerScreen, { type PickableMeal } from '@/components/MealTypePickerScreen'
import MealThumbnail from '@/components/MealThumbnail'
import GeneratingStatus from '@/components/GeneratingStatus'
import { useCyclingMessage } from '@/hooks/useCyclingMessage'
import { MEAL_GENERATING_MESSAGES } from '@/lib/generatingMessages'
import { groupItemsByCategory } from '@/lib/grocery'
import sheetStyles from '@/components/sheets.module.css'
import type { SafeUser } from '@/lib/auth-shared'
import { timeGreeting, userInitials } from '@/lib/auth-shared'
import AccountSettings from '@/components/AccountSettings'
import styles from '@/app/dashboard/page.module.css'

const emptyMealForm = (mealType: MealType = 'dinner') => ({
  mealType,
  name: '',
  emoji: '',
  tags: [] as string[],
  isVeg: false,
  proteinG: '',
  carbsG: '',
  fatG: '',
  notes: '',
  servingSize: '',
  servingWeight: '',
  description: '',
  instructions: '',
  ingredients: '',
  samItems: '',
  htItems: '',
})

function mealMatchesSearch(m: Meal, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    m.name,
    MEAL_TYPE_LABELS[normalizeMealType(m.mealType)],
    ...m.tags,
    m.description,
    m.notes ?? '',
    ...m.ingredients,
  ]
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).filter(Boolean).every(term => haystack.includes(term))
}

const mealToForm = (m: Meal) => ({
  mealType: normalizeMealType(m.mealType),
  name: m.name,
  emoji: m.emoji,
  tags: m.tags ?? [],
  isVeg: m.isVeg ?? false,
  proteinG: String(m.proteinG ?? ''),
  carbsG: String(m.carbsG ?? ''),
  fatG: String(m.fatG ?? ''),
  notes: m.notes ?? '',
  servingSize: m.servingSize ?? '',
  servingWeight: m.servingWeight ?? '',
  description: m.description ?? '',
  instructions: m.instructions ?? '',
  ingredients: (m.ingredients ?? []).join('\n'),
  samItems: (m.samItems ?? []).join('\n'),
  htItems: (m.htItems ?? []).join('\n'),
})

type Page = 'week' | 'meals' | 'grocery' | 'history' | 'settings'
type SheetType = 'kids' | 'addMeal' | null
type WeekNav = 'overview' | 'day' | 'mealType'

type DinnerDeckAppProps = { user: SafeUser }

export default function DinnerDeckApp({ user }: DinnerDeckAppProps) {
  const [page, setPage] = useState<Page>('week')
  const [weekStart] = useState(getWeekStart())
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [kidsMeals, setKidsMeals] = useState<KidsMeal[]>([])
  const [history, setHistory] = useState<MealHistory[]>([])
  const [weekNav, setWeekNav] = useState<WeekNav>('overview')
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [sheetType, setSheetType] = useState<SheetType>(null)
  const [sheetDay, setSheetDay] = useState<DayOfWeek | null>(null)
  const [dayMealTypes, setDayMealTypes] = useState<DayMealTypesState>(() => loadDayMealTypesState())
  const [mealFocus, setMealFocus] = useState<MealFocusPrefs>(() => loadMealFocus())
  const [mealFilter, setMealFilter] = useState('all')
  const [mealSearch, setMealSearch] = useState('')
  const [expandedMealTypes, setExpandedMealTypes] = useState<Set<MealType>>(() => new Set())
  const [groceryChecked, setGroceryChecked] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestingPicker, setSuggestingPicker] = useState(false)
  const [pickerSuggestions, setPickerSuggestions] = useState<MealSuggestion[]>([])
  const [importing, setImporting] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [detailMeal, setDetailMeal] = useState<Meal | MealSuggestion | null>(null)
  const [detailPick, setDetailPick] = useState<PickableMeal | null>(null)
  const [detailSlot, setDetailSlot] = useState<{ day: DayOfWeek; mealType: MealType } | null>(null)
  const [editingMealId, setEditingMealId] = useState<number | null>(null)
  const [addForm, setAddForm] = useState(emptyMealForm)

  const suggestMessage = useCyclingMessage(suggesting, MEAL_GENERATING_MESSAGES)
  const importMessage = useCyclingMessage(importing, MEAL_GENERATING_MESSAGES)
  const activeGeneratingMessage = suggesting || suggestingPicker ? suggestMessage : importMessage

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const fetchWeekPlan = useCallback(async () => {
    const res = await fetch(`/api/week-plan?weekStart=${weekStart}`)
    const data: DayPlan[] = await res.json()
    setWeekPlan(data.map(p => ({ ...p, mealType: p.mealType ?? 'dinner' })))
  }, [weekStart])

  const fetchMeals = useCallback(async () => {
    const res = await fetch('/api/meals')
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('fetchMeals:', err)
      showToast('Could not load meals — check database migrations')
      return
    }
    setMeals(await res.json())
  }, [])

  const fetchKids = useCallback(async () => {
    const res = await fetch('/api/kids-meals')
    setKidsMeals(await res.json())
  }, [])

  const fetchHistory = useCallback(async () => {
    const res = await fetch('/api/meal-history')
    const data = await res.json()
    setHistory(data.history)
  }, [])

  useEffect(() => {
    fetchWeekPlan()
    fetchMeals()
    fetchKids()
  }, [fetchWeekPlan, fetchMeals, fetchKids])

  useEffect(() => {
    if (page === 'history') fetchHistory()
  }, [page, fetchHistory])

  useEffect(() => {
    setPickerSuggestions([])
  }, [selectedMealType, selectedDay])

  const updateSlot = async (day: string, mealType: MealType, updates: Partial<DayPlan>) => {
    const existing = weekPlan.find(p => p.dayOfWeek === day && p.mealType === mealType)
    const payload = {
      weekStart,
      dayOfWeek: day,
      mealType,
      isLeftover: false,
      servings: 4,
      adultMealId: null,
      kidsMealId: null,
      ...existing,
      ...updates,
    }
    await fetch('/api/week-plan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    fetchWeekPlan()
  }

  const assignSlot = async (body: Record<string, unknown>) => {
    setAssigning(true)
    try {
      const res = await fetch('/api/week-plan/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, ...body }),
      })
      if (!res.ok) throw new Error('assign failed')
      await Promise.all([fetchWeekPlan(), fetchMeals()])
      setWeekNav('day')
      setSelectedMealType(null)
      showToast('Meal added to your week')
    } catch {
      showToast('Could not save — try again')
    } finally {
      setAssigning(false)
    }
  }

  const handleSuggestMealTypeIdeas = async () => {
    if (!selectedMealType || !supportsMealTypeIdeasSuggest(selectedMealType)) return
    setSuggestingPicker(true)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: selectedMealType,
          mealFocus,
        }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error((errBody as { error?: string }).error ?? 'suggest failed')
      }
      const { suggestions } = (await res.json()) as { suggestions: GroupedSuggestions }
      const items = suggestions[selectedMealType] ?? []
      if (!items.length) throw new Error('no suggestions')
      setPickerSuggestions(items)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong — try again'
      showToast(msg === 'suggest failed' || msg === 'no suggestions' ? 'Could not get ideas — try again' : msg)
    } finally {
      setSuggestingPicker(false)
    }
  }

  const handleSuggest = async () => {
    setSuggesting(true)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingMealNames: meals.map(m => m.name).slice(-10),
          favoriteMealNames: meals.filter(m => m.isFavorite).map(m => m.name).slice(-10),
          mealFocus,
        }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error((errBody as { error?: string }).error ?? 'suggest failed')
      }
      const { suggestions } = (await res.json()) as { suggestions: GroupedSuggestions }

      const selections =
        (suggestions.dinner?.length ?? 0) > 0
          ? [{ mealType: 'dinner' as const, meals: suggestions.dinner! }]
          : []

      if (!selections.length) throw new Error('no suggestions')

      const bulkRes = await fetch('/api/meals/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, selections }),
      })
      if (!bulkRes.ok) throw new Error('bulk failed')

      clearWeekSuggestions(weekStart)
      await Promise.all([fetchMeals(), fetchWeekPlan()])
      showToast('Week planned — meals are in your library; swap or remove any time')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong — try again'
      showToast(msg === 'suggest failed' || msg === 'bulk failed' ? 'Something went wrong — try again' : msg)
    } finally {
      setSuggesting(false)
    }
  }

  const mealFromPick = (pick: PickableMeal): Meal | MealSuggestion => {
    if (pick.libraryId) return meals.find(m => m.id === pick.libraryId) ?? pick.meal
    return pick.meal
  }

  const openPlanMealDetail = (pick: PickableMeal, slot?: { day: DayOfWeek; mealType: MealType }) => {
    setDetailPick(pick)
    setDetailSlot(slot ?? null)
    setDetailMeal(mealFromPick(pick))
  }

  const openDaySlotDetail = (mealType: MealType, meal: Meal | PlannedMeal) => {
    if (!selectedDay) return
    const plan = weekPlan.find(p => p.dayOfWeek === selectedDay && p.mealType === mealType)
    const pick: PickableMeal = plan?.adultMealId
      ? {
          key: `lib-${plan.adultMealId}`,
          source: 'library',
          meal,
          libraryId: plan.adultMealId,
        }
      : { key: `slot-${selectedDay}-${mealType}`, source: 'suggestion', meal }
    openPlanMealDetail(pick, { day: selectedDay, mealType })
  }

  const handleDetailUpdate = () => {
    if (!detailPick) return
    const day = detailSlot?.day ?? selectedDay
    const mealType = detailSlot?.mealType ?? selectedMealType
    if (!day || !mealType) return
    void assignPickToSlot(detailPick, day, mealType)
    closeDetailModal()
  }

  const handleSwapMeal = (pick: PickableMeal) => {
    handleAssignPick(pick)
  }

  const assignedMealIdForPicker =
    selectedDay && selectedMealType
      ? (weekPlan.find(p => p.dayOfWeek === selectedDay && p.mealType === selectedMealType)?.adultMealId ??
        null)
      : null

  const assignPickToSlot = async (pick: PickableMeal, day: DayOfWeek, mealType: MealType) => {
    if (pick.source === 'library' && pick.libraryId) {
      await assignSlot({
        dayOfWeek: day,
        mealType,
        mode: 'library',
        mealId: pick.libraryId,
      })
      return
    }
    await assignSlot({
      dayOfWeek: day,
      mealType,
      mode: 'suggestion',
      meal: pick.meal,
      saveToLibrary: true,
    })
  }

  const handleAssignPick = (pick: PickableMeal) => {
    if (!selectedDay || !selectedMealType) return
    void assignPickToSlot(pick, selectedDay, selectedMealType)
  }

  const handleAddMealTypeToDay = (day: DayOfWeek, mealType: MealType) => {
    setDayMealTypes(prev => {
      const next = addMealTypeToDay(day, mealType, prev)
      saveDayMealTypesState(next)
      return next
    })
    setSelectedMealType(mealType)
    setWeekNav('mealType')
  }

  const toggleMealFocusPreset = (id: MealFocusPresetId) => {
    setMealFocus(prev => {
      const next: MealFocusPrefs = {
        ...prev,
        presets: prev.presets.includes(id)
          ? prev.presets.filter(p => p !== id)
          : [...prev.presets, id],
      }
      saveMealFocus(next)
      return next
    })
  }

  const updateMealFocusCustom = (custom: string) => {
    setMealFocus(prev => {
      const next = { ...prev, custom }
      saveMealFocus(next)
      return next
    })
  }

  const handleImport = async () => {
    if (!importUrl) return
    setImporting(true)
    try {
      const res = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: importUrl,
          mealType: sheetType === 'addMeal' ? addForm.mealType : 'dinner',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error ?? 'Could not extract recipe — try adding manually')
        return
      }
      const { meal, cached } = data
      if (meal) {
        fetchMeals()
        setImportUrl('')
        if (sheetType === 'addMeal') {
          setAddForm({
            mealType: addForm.mealType,
            name: meal.name,
            emoji: meal.emoji,
            tags: meal.tags ?? [],
            isVeg: meal.isVeg ?? false,
            proteinG: String(meal.proteinG ?? ''),
            carbsG: String(meal.carbsG ?? ''),
            fatG: String(meal.fatG ?? ''),
            notes: meal.notes ?? '',
            servingSize: meal.servingSize ?? '',
            servingWeight: meal.servingWeight ?? '',
            description: meal.description ?? '',
            instructions: meal.instructions ?? '',
            ingredients: (meal.ingredients ?? []).join('\n'),
            samItems: (meal.samItems ?? []).join('\n'),
            htItems: (meal.htItems ?? []).join('\n'),
          })
          showToast('Recipe loaded — review and save')
        } else {
          showToast(cached ? `Already in your library: ${meal.name}` : `Added: ${meal.name}`)
          setDetailMeal(meal)
        }
      }
    } catch {
      showToast('Could not extract recipe — try adding manually')
    } finally {
      setImporting(false)
    }
  }

  const closeMealSheet = () => {
    setSheetType(null)
    setEditingMealId(null)
    setAddForm(emptyMealForm())
  }

  const closeDetailModal = () => {
    setDetailMeal(null)
    setDetailPick(null)
    setDetailSlot(null)
  }

  const openEditMeal = (meal: Meal) => {
    closeDetailModal()
    setEditingMealId(meal.id)
    setAddForm(mealToForm(meal))
    setSheetType('addMeal')
  }

  const openEditFromDetail = () => {
    if (detailMeal && 'id' in detailMeal) openEditMeal(detailMeal)
  }

  const handleSaveMeal = async () => {
    if (!addForm.name) { showToast('Enter a meal name'); return }
    const payload = {
      name: addForm.name,
      emoji: addForm.emoji || '🍽',
      tags: addForm.tags,
      isVeg: addForm.isVeg,
      proteinG: parseInt(addForm.proteinG) || 0,
      carbsG: parseInt(addForm.carbsG) || 0,
      fatG: parseInt(addForm.fatG) || 0,
      notes: addForm.notes,
      servingSize: addForm.servingSize,
      servingWeight: addForm.servingWeight,
      description: addForm.description,
      instructions: addForm.instructions,
      ingredients: addForm.ingredients.split('\n').filter(Boolean),
      samItems: addForm.samItems.split('\n').filter(Boolean),
      htItems: addForm.htItems.split('\n').filter(Boolean),
      mealType: addForm.mealType,
    }

    if (editingMealId) {
      await fetch('/api/meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingMealId, ...payload }),
      })
      showToast(`"${addForm.name}" updated`)
    } else {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      showToast(`"${addForm.name}" added to your library`)
    }

    fetchMeals()
    closeMealSheet()
  }

  const handleDeleteMeal = async (meal: Meal) => {
    if (!confirm(`Remove "${meal.name}" from your library?\n\nPast meals in history will stay — this only removes it from planning and the meal list.`)) {
      return
    }
    await fetch(`/api/meals?id=${meal.id}`, { method: 'DELETE' })
    closeDetailModal()
    fetchMeals()
    fetchWeekPlan()
    showToast(`"${meal.name}" removed from library`)
  }

  const toggleFav = async (meal: Meal) => {
    await fetch('/api/meals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: meal.id, isFavorite: !meal.isFavorite }),
    })
    fetchMeals()
  }

  const toggleKidsLike = async (km: KidsMeal) => {
    await fetch('/api/kids-meals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: km.id, liked: !km.liked }),
    })
    fetchKids()
    showToast(km.liked ? 'Removed from liked' : 'Marked as a hit!')
  }

  const getDayPlan = (day: string, mealType: MealType = 'dinner') =>
    weekPlan.find(p => p.dayOfWeek === day && p.mealType === mealType)

  const dinnerPlans = weekPlan.filter(p => p.mealType === 'dinner')
  const usedMealIds = new Set(weekPlan.filter(p => !p.isLeftover && p.adultMealId).map(p => p.adultMealId!))
  const usedDays = (mealId: number) =>
    weekPlan.filter(p => p.adultMealId === mealId).map(p => `${p.dayOfWeek} (${MEAL_TYPE_LABELS[p.mealType as MealType] ?? p.mealType})`)

  const filteredMeals = meals.filter(m => {
    if (mealFilter === 'fav' && !m.isFavorite) return false
    if (mealFilter === 'veg' && !m.isVeg) return false
    if (mealFilter === 'hp' && !m.tags.includes('high-protein')) return false
    if (mealFilter === 'lc' && !m.tags.includes('low-carb')) return false
    if (mealFilter === 'ai' && !m.aiGenerated) return false
    return mealMatchesSearch(m, mealSearch)
  })

  const mealsByType = groupMealsByType(filteredMeals)
  const mealSearchActive = mealSearch.trim().length > 0
  const isMealTypeExpanded = (mealType: MealType) =>
    mealSearchActive || expandedMealTypes.has(mealType)

  const toggleMealTypeSection = (mealType: MealType) => {
    setExpandedMealTypes(prev => {
      const next = new Set(prev)
      if (next.has(mealType)) next.delete(mealType)
      else next.add(mealType)
      return next
    })
  }

  const groceryMealIds = new Set(
    dinnerPlans.filter(p => !p.isLeftover && p.adultMealId).map(p => p.adultMealId!)
  )
  const groceryMeals = meals.filter(m => groceryMealIds.has(m.id))
  const samsItems = new Map<string, number>()
  const htItems = new Map<string, number>()
  groceryMeals.forEach(m => {
    const srv = Math.max(...dinnerPlans.filter(p => p.adultMealId === m.id).map(p => p.servings))
    const mult = srv > 4 ? 2 : 1
    m.samItems.forEach(i => samsItems.set(i, (samsItems.get(i) || 0) + mult))
    m.htItems.forEach(i => htItems.set(i, (htItems.get(i) || 0) + mult))
  })

  const samsGrouped = groupItemsByCategory(samsItems, 's')
  const htGrouped = groupItemsByCategory(htItems, 'h')
  const allGroceryIds = [...samsGrouped, ...htGrouped].flatMap(g => g.items.map(i => i.id))
  const detailInLibrary = detailMeal && 'id' in detailMeal ? meals.some(m => m.id === detailMeal.id) : false

  return (
    <div className={styles.shell}>
      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarMain}>
          <div>
            <BrandMark size="sm" className={styles.logo} />
            <div className={styles.topSub}>
              {page === 'week' && weekNav === 'overview'
                ? timeGreeting(user.name)
                : {
                    week:
                      weekNav === 'mealType' && selectedDay && selectedMealType
                        ? `${selectedDay} · ${MEAL_TYPE_LABELS[selectedMealType]}`
                        : weekNav === 'day' && selectedDay
                          ? selectedDay
                          : 'Plan this week',
                    meals: 'Meal library',
                    grocery: `${user.name}'s grocery list`,
                    history: 'Past meals',
                    settings: 'Settings',
                  }[page]}
            </div>
          </div>
          <div className={styles.userAvatar} title={user.name} aria-label={user.name}>
            {userInitials(user.name)}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={styles.content}>

        {/* ===== WEEK ===== */}
        {page === 'week' && weekNav === 'overview' && (
          <div>
            <button className={styles.fabPrimary} onClick={handleSuggest} disabled={suggesting}>
              {suggesting ? '⏳ Cooking up ideas…' : '✨ Suggest this week'}
            </button>
            <WeekOverview
              weekPlan={weekPlan}
              meals={meals}
              onSelectDay={day => {
                setSelectedDay(day)
                setWeekNav('day')
              }}
              onGoGrocery={() => setPage('grocery')}
              groceryMealCount={groceryMeals.length}
            />
          </div>
        )}

        {page === 'week' && weekNav === 'day' && selectedDay && (
          <DayPlanScreen
            day={selectedDay}
            mealTypesForDay={getMealTypesForDay(selectedDay, dayMealTypes, weekPlan)}
            addableMealTypes={mealTypesAvailableToAdd(selectedDay, dayMealTypes, weekPlan)}
            weekPlan={weekPlan}
            meals={meals}
            kidsMeals={kidsMeals}
            onBack={() => {
              setWeekNav('overview')
              setSelectedDay(null)
            }}
            onSelectMealType={mt => {
              setPickerSuggestions([])
              setSelectedMealType(mt)
              setWeekNav('mealType')
            }}
            onAddMealType={mt => handleAddMealTypeToDay(selectedDay, mt)}
            onViewSlotMeal={openDaySlotDetail}
            onKidsPicker={() => {
              setSheetDay(selectedDay)
              setSheetType('kids')
            }}
          />
        )}

        {page === 'week' && weekNav === 'mealType' && selectedDay && selectedMealType && (
          <MealTypePickerScreen
            day={selectedDay}
            mealType={selectedMealType}
            suggestions={pickerSuggestions}
            libraryMeals={meals.filter(m => normalizeMealType(m.mealType) === selectedMealType)}
            assigning={assigning}
            suggesting={suggestingPicker}
            onSuggestIdeas={
              supportsMealTypeIdeasSuggest(selectedMealType) ? handleSuggestMealTypeIdeas : undefined
            }
            onBack={() => {
              setPickerSuggestions([])
              setWeekNav('day')
              setSelectedMealType(null)
            }}
            onAssignLeftover={() =>
              void assignSlot({ dayOfWeek: selectedDay, mealType: selectedMealType, mode: 'leftover' })
            }
            onAssignEatOut={() =>
              void assignSlot({ dayOfWeek: selectedDay, mealType: selectedMealType, mode: 'eat_out' })
            }
            assignedMealId={assignedMealIdForPicker}
            onSwap={handleSwapMeal}
            onViewDetails={openPlanMealDetail}
          />
        )}

        {/* ===== MEALS ===== */}
        {page === 'meals' && (
          <div>
            <div className={styles.importRow}>
              <input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="Paste recipe URL to import…" />
              <button className={styles.fabPrimary} style={{ width: 'auto', padding: '9px 14px' }} onClick={handleImport} disabled={importing}>
                {importing ? '⏳ Importing…' : 'Import'}
              </button>
            </div>

            <div className={styles.mealSearchRow}>
              <input
                type="search"
                value={mealSearch}
                onChange={e => setMealSearch(e.target.value)}
                placeholder="Search meals by name, tags, ingredients…"
                aria-label="Search meals"
                className={styles.mealSearchInput}
              />
              {mealSearchActive && (
                <button
                  type="button"
                  className={styles.mealSearchClear}
                  onClick={() => setMealSearch('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {filteredMeals.length > 0 && (
              <p className={styles.mealLibrarySummary}>
                {mealSearchActive || mealFilter !== 'all'
                  ? `${filteredMeals.length} meal${filteredMeals.length === 1 ? '' : 's'} match`
                  : `${filteredMeals.length} meal${filteredMeals.length === 1 ? '' : 's'} · tap a category to browse`}
              </p>
            )}

            <div className={styles.filterRow}>
              {[['all','All'],['fav','⭐ Favs'],['hp','High protein'],['veg','Vegetarian'],['lc','Low carb'],['ai','AI picks']].map(([f,l]) => (
                <button key={f} className={`${styles.chip} ${mealFilter === f ? styles.chipOn : ''}`} onClick={() => setMealFilter(f)}>{l}</button>
              ))}
            </div>

            <button className={styles.fabSecondary} onClick={() => { setEditingMealId(null); setAddForm(emptyMealForm()); setSheetType('addMeal') }}>+ Add meal manually</button>

            <div className={styles.mealLibraryList}>
              {mealsByType.length === 0 ? (
                <p className={styles.mealLibraryEmpty}>
                  {mealSearchActive
                    ? `No meals match “${mealSearch.trim()}”.`
                    : 'No meals match this filter.'}
                </p>
              ) : mealsByType.map(({ mealType, meals: groupMeals }) => {
                const expanded = isMealTypeExpanded(mealType)
                return (
                <section key={mealType} className={styles.mealTypeSection}>
                  <button
                    type="button"
                    className={`${styles.mealTypeSectionTitle} ${expanded ? styles.mealTypeSectionTitleOpen : ''}`}
                    onClick={() => toggleMealTypeSection(mealType)}
                    aria-expanded={expanded}
                  >
                    <span className={styles.mealTypeSectionChevron} aria-hidden>
                      {expanded ? '▼' : '▶'}
                    </span>
                    <span className={styles.mealTypeSectionLabel}>{MEAL_TYPE_LABELS[mealType]}</span>
                    <span className={styles.mealTypeSectionCount}>{groupMeals.length}</span>
                  </button>
                  {!expanded && (
                    <p className={styles.mealTypeSectionPreview}>
                      {groupMeals.slice(0, 3).map(m => m.name).join(' · ')}
                      {groupMeals.length > 3 ? ` · +${groupMeals.length - 3} more` : ''}
                    </p>
                  )}
                  {expanded && groupMeals.map(m => (
                <div key={m.id} className={`${styles.mealItem} ${usedMealIds.has(m.id) ? styles.mealInUse : ''}`}>
                  <MealThumbnail emoji={m.emoji} size="lg" className={styles.mealEmoji} />
                  <div className={styles.mealInfo} onClick={() => setDetailMeal(m)} role="button" tabIndex={0}>
                    <div className={styles.mealName}>{m.name} {m.aiGenerated && <span className={styles.aiBadge}>AI</span>}</div>
                    <div className={styles.mealTags}>
                      {m.tags.includes('high-protein') && <span className={`${styles.tag} ${styles.tagP}`}>high protein</span>}
                      {m.isVeg && <span className={`${styles.tag} ${styles.tagV}`}>veg-friendly</span>}
                      {m.tags.includes('low-carb') && <span className={`${styles.tag} ${styles.tagLc}`}>low carb</span>}
                    </div>
                    <div className={styles.mealMacros}>{m.proteinG}g protein · {m.carbsG}g carbs · {m.fatG}g fat</div>
                    <div className={styles.mealHint}>Tap for recipe details</div>
                    {usedMealIds.has(m.id) && <div className={styles.inUseBanner}>📅 This week: {usedDays(m.id).join(', ')}</div>}
                  </div>
                  <button className={`${styles.favBtn} ${m.isFavorite ? styles.favOn : ''}`} onClick={e => { e.stopPropagation(); toggleFav(m) }}>★</button>
                </div>
                  ))}
                </section>
              )})}
            </div>
          </div>
        )}

        {/* ===== GROCERY ===== */}
        {page === 'grocery' && (
          <div>
            {groceryMeals.length === 0
              ? <p style={{ color: 'var(--muted)' }}>Plan your week first.</p>
              : <>
                  <div className={styles.statsRow}>
                    <div className={styles.statBox}><div className={styles.statNum}>{samsItems.size + htItems.size}</div><div className={styles.statLabel}>Total items</div></div>
                    <div className={styles.statBox}><div className={styles.statNum}>{groceryChecked.size}</div><div className={styles.statLabel}>Checked off</div></div>
                  </div>
                  <div className={styles.btnRow}>
                    <button className={styles.fabSecondary} onClick={() => setGroceryChecked(new Set(allGroceryIds))}>Check all</button>
                    <button className={styles.fabSecondary} onClick={() => setGroceryChecked(new Set())}>Clear all</button>
                  </div>
                  {samsGrouped.length > 0 && (
                    <div className={styles.storeSection}>
                      <div className={styles.storeHead}><span className={`${styles.storeBadge} ${styles.storeSams}`}>Sam&apos;s Club</span><span className={styles.storeCount}>{samsItems.size} items · bulk</span></div>
                      {samsGrouped.map(group => (
                        <div key={group.category} className={styles.groceryCategory}>
                          <h4 className={styles.groceryCategoryTitle}>{group.category}</h4>
                          {group.items.map(({ id, name, qty }) => {
                            const ck = groceryChecked.has(id)
                            return (
                              <div key={id} className={`${styles.gItem} ${ck ? styles.gDone : ''}`}>
                                <input type="checkbox" checked={ck} onChange={e => { const s = new Set(groceryChecked); e.target.checked ? s.add(id) : s.delete(id); setGroceryChecked(s) }} />
                                <label>{name}</label>
                                {qty > 1 && <span className={styles.gQty}>×{qty}</span>}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  {htGrouped.length > 0 && (
                    <div className={styles.storeSection}>
                      <div className={styles.storeHead}><span className={`${styles.storeBadge} ${styles.storeHt}`}>Harris Teeter</span><span className={styles.storeCount}>{htItems.size} items · fresh</span></div>
                      {htGrouped.map(group => (
                        <div key={group.category} className={styles.groceryCategory}>
                          <h4 className={styles.groceryCategoryTitle}>{group.category}</h4>
                          {group.items.map(({ id, name, qty }) => {
                            const ck = groceryChecked.has(id)
                            return (
                              <div key={id} className={`${styles.gItem} ${ck ? styles.gDone : ''}`}>
                                <input type="checkbox" checked={ck} onChange={e => { const s = new Set(groceryChecked); e.target.checked ? s.add(id) : s.delete(id); setGroceryChecked(s) }} />
                                <label>{name}</label>
                                {qty > 1 && <span className={styles.gQty}>×{qty}</span>}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </>}
          </div>
        )}

        {/* ===== HISTORY ===== */}
        {page === 'history' && (
          <div>
            {history.length === 0
              ? <p style={{ color: 'var(--muted)' }}>No past meals yet. Complete a week and your history will appear here.</p>
              : (() => {
                  const byWeek: Record<string, MealHistory[]> = {}
                  history.forEach(h => {
                    const key = h.weekStart.slice(0, 10)
                    if (!byWeek[key]) byWeek[key] = []
                    byWeek[key].push(h)
                  })
                  return Object.entries(byWeek).map(([week, entries]) => (
                    <div key={week} className={styles.historyWeek}>
                      <div className={styles.historyWeekLabel}>Week of {new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      {entries.map(h => (
                        <div key={h.id} className={styles.historyItem} onClick={() => setDetailMeal(h.meal)} role="button" tabIndex={0}>
                          <MealThumbnail emoji={h.meal.emoji} size="lg" className={styles.histEmoji} />
                          <div>
                            <div className={styles.histName}>{h.meal.name}</div>
                            <div className={styles.histMeta}>{h.dayOfWeek} · {h.servings} servings · {h.meal.proteinG}g protein</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                })()}
          </div>
        )}

        {/* ===== SETTINGS ===== */}
        {page === 'settings' && (
          <div>
            <AccountSettings user={user} />
            <section className={styles.settingsSection}>
              <h2 className={styles.settingsTitle}>Meal focus</h2>
              <p className={styles.settingsDesc}>
                Used when you tap Suggest this week. Pick one or more focuses, or add your own.
              </p>
              <div className={styles.focusChips}>
                {MEAL_FOCUS_PRESETS.map(({ id, label }) => {
                  const on = mealFocus.presets.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                      onClick={() => toggleMealFocusPreset(id)}
                      aria-pressed={on}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <label className={styles.formLabel} htmlFor="meal-focus-custom">
                Custom focus (optional)
              </label>
              <textarea
                id="meal-focus-custom"
                className={styles.focusCustom}
                value={mealFocus.custom}
                onChange={e => updateMealFocusCustom(e.target.value)}
                rows={2}
                placeholder="e.g. more fish, no pork, quick 20-min meals"
              />
            </section>
          </div>
        )}

      </main>

      {(suggesting || suggestingPicker || importing) && (
        <div className={styles.generatingBanner} aria-busy="true">
          <GeneratingStatus message={activeGeneratingMessage} className={styles.generatingBannerStatus} />
        </div>
      )}

      {/* Bottom nav */}
      <nav className={styles.bottomNav}>
        {([['week','🗓','Week'],['meals','🍽','Meals'],['grocery','🛒','Grocery'],['history','📖','History'],['settings','⚙️','Settings']] as const).map(([p,icon,label]) => (
          <button
            key={p}
            className={`${styles.bnItem} ${page === p ? styles.bnActive : ''}`}
            onClick={() => {
              setPage(p as Page)
              if (p === 'week') {
                setWeekNav('overview')
                setSelectedDay(null)
                setSelectedMealType(null)
              }
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {sheetType === 'kids' && sheetDay && (
        <KidsPickerSheet
          day={sheetDay}
          dayPlan={getDayPlan(sheetDay, 'dinner')}
          kidsMeals={kidsMeals}
          meals={meals}
          onClose={() => setSheetType(null)}
          onSelectSameAsAdults={() => { updateSlot(sheetDay, 'dinner', { kidsMealId: null }); setSheetType(null) }}
          onSelectKidsMeal={kidsMealId => { updateSlot(sheetDay, 'dinner', { kidsMealId }); setSheetType(null) }}
        />
      )}

      {sheetType === 'addMeal' && (
        <div className={sheetStyles.overlay} onClick={closeMealSheet}>
          <div className={sheetStyles.sheet} style={{ maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className={sheetStyles.sheetHandle} />
            <h2 className={sheetStyles.sheetTitle}>{editingMealId ? 'Edit meal' : 'Add meal'}</h2>
            <div className={styles.addForm}>
              <label className={styles.formLabel}>Meal type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {MEAL_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.chip} ${addForm.mealType === t ? styles.chipOn : ''}`}
                    onClick={() => setAddForm({ ...addForm, mealType: t })}
                  >
                    {MEAL_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              <label className={styles.formLabel}>Meal name *</label>
              <input value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="e.g. Honey garlic chicken" style={{ marginBottom: 12 }} />

              <label className={styles.formLabel}>Paste recipe URL (optional)</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://…" />
                <button className={styles.fabPrimary} style={{ width: 'auto', padding: '9px 12px', flexShrink: 0 }} onClick={handleImport} disabled={importing}>{importing ? '⏳ Extracting…' : 'Extract'}</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label className={styles.formLabel}>Emoji</label>
                  <input value={addForm.emoji} onChange={e => setAddForm({...addForm, emoji: e.target.value})} placeholder="🍽" style={{ fontSize: 22, textAlign: 'center' }} />
                </div>
                <div>
                  <label className={styles.formLabel}>Tags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {['high-protein','low-carb','balanced','vegetarian'].map(t => (
                      <span key={t} className={`${styles.chip} ${addForm.tags.includes(t) ? styles.chipOn : ''}`} style={{ cursor: 'pointer' }}
                        onClick={() => setAddForm({...addForm, tags: addForm.tags.includes(t) ? addForm.tags.filter((x:string)=>x!==t) : [...addForm.tags, t], isVeg: t==='vegetarian' ? !addForm.isVeg : addForm.isVeg })}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div><label className={styles.formLabel}>Protein (g)</label><input type="number" value={addForm.proteinG} onChange={e => setAddForm({...addForm, proteinG: e.target.value})} placeholder="30" /></div>
                <div><label className={styles.formLabel}>Carbs (g)</label><input type="number" value={addForm.carbsG} onChange={e => setAddForm({...addForm, carbsG: e.target.value})} placeholder="20" /></div>
                <div><label className={styles.formLabel}>Fat (g)</label><input type="number" value={addForm.fatG} onChange={e => setAddForm({...addForm, fatG: e.target.value})} placeholder="10" /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label className={styles.formLabel}>Serving size</label>
                  <input
                    value={addForm.servingSize}
                    onChange={e => setAddForm({ ...addForm, servingSize: e.target.value })}
                    placeholder="4 servings"
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Weight per serving</label>
                  <input
                    value={addForm.servingWeight}
                    onChange={e => setAddForm({ ...addForm, servingWeight: e.target.value })}
                    placeholder="~350g"
                  />
                </div>
              </div>

              <label className={styles.formLabel}>Notes</label>
              <textarea
                value={addForm.notes}
                onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                rows={2}
                placeholder="Prep tips, substitutions, who likes it…"
                style={{ marginBottom: 12 }}
              />

              <label className={styles.formLabel}>Description</label>
              <textarea value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} rows={3} placeholder="What is this dish?" style={{ marginBottom: 12 }} />

              <label className={styles.formLabel}>How to cook</label>
              <textarea value={addForm.instructions} onChange={e => setAddForm({...addForm, instructions: e.target.value})} rows={4} placeholder="Step 1: …&#10;Step 2: …" style={{ marginBottom: 12 }} />

              <label className={styles.formLabel}>Ingredients (one per line)</label>
              <textarea value={addForm.ingredients} onChange={e => setAddForm({...addForm, ingredients: e.target.value})} rows={3} placeholder="1 lb chicken thighs&#10;2 tbsp olive oil" style={{ marginBottom: 12 }} />

              <label className={styles.formLabel}>Sam&apos;s Club items (one per line)</label>
              <textarea value={addForm.samItems} onChange={e => setAddForm({...addForm, samItems: e.target.value})} rows={2} placeholder="Chicken thighs 4lb&#10;Olive oil" style={{ marginBottom: 12 }} />

              <label className={styles.formLabel}>Harris Teeter items (one per line)</label>
              <textarea value={addForm.htItems} onChange={e => setAddForm({...addForm, htItems: e.target.value})} rows={2} placeholder="Lemon&#10;Fresh herbs" style={{ marginBottom: 16 }} />

              <button className={styles.fabPrimary} onClick={handleSaveMeal}>{editingMealId ? 'Save changes' : 'Save meal'}</button>
            </div>
          </div>
        </div>
      )}

      {detailMeal && (
        <MealDetailModal
          meal={detailMeal}
          onClose={closeDetailModal}
          onEdit={detailInLibrary && !detailPick ? openEditFromDetail : undefined}
          onDelete={
            detailInLibrary && !detailPick && detailMeal && 'id' in detailMeal
              ? () => handleDeleteMeal(detailMeal)
              : undefined
          }
          onUpdate={
            detailPick && (detailSlot || (selectedDay && selectedMealType)) ? handleDetailUpdate : undefined
          }
          updateLabel={
            detailPick && (detailSlot || (selectedDay && selectedMealType))
              ? `Update ${(detailSlot?.day ?? selectedDay)!} ${MEAL_TYPE_LABELS[(detailSlot?.mealType ?? selectedMealType)!]}`
              : undefined
          }
        />
      )}

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
