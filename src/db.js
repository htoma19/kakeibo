import { get, set } from 'idb-keyval'

// IndexedDB に保存するキー
const KEYS = {
  expenses: 'kakeibo.expenses',
  categories: 'kakeibo.categories',
  settings: 'kakeibo.settings',
  version: 'kakeibo.version',
}

// 将来データ構造を変えるときの移行に使うバージョン番号
export const SCHEMA_VERSION = 1

export const DEFAULT_CATEGORIES = [
  { id: 'food', name: '食費', color: '#ef4444', icon: '🍚', order: 0 },
  { id: 'eatout', name: '外食', color: '#f97316', icon: '🍜', order: 1 },
  { id: 'transit', name: '交通費', color: '#3b82f6', icon: '🚃', order: 2 },
  { id: 'daily', name: '日用品', color: '#10b981', icon: '🧴', order: 3 },
  { id: 'hobby', name: '趣味', color: '#a855f7', icon: '🎮', order: 4 },
  { id: 'social', name: '交際費', color: '#ec4899', icon: '🍻', order: 5 },
  { id: 'fixed', name: '固定費', color: '#64748b', icon: '🏠', order: 6 },
  { id: 'other', name: 'その他', color: '#94a3b8', icon: '📦', order: 7 },
]

export const DEFAULT_SETTINGS = {
  dailyBudget: 2000,
  hourlyWage: 0,
}

// 起動時に全データを読み込み（無ければ初期値を作って保存）
export async function loadAll() {
  let [expenses, categories, settings] = await Promise.all([
    get(KEYS.expenses),
    get(KEYS.categories),
    get(KEYS.settings),
  ])

  if (!Array.isArray(categories)) {
    categories = DEFAULT_CATEGORIES
    await set(KEYS.categories, categories)
  }
  if (!settings) {
    settings = DEFAULT_SETTINGS
    await set(KEYS.settings, settings)
  }
  if (!Array.isArray(expenses)) {
    expenses = []
  }
  await set(KEYS.version, SCHEMA_VERSION)

  return {
    expenses,
    categories,
    settings: { ...DEFAULT_SETTINGS, ...settings },
  }
}

export async function saveExpenses(expenses) {
  await set(KEYS.expenses, expenses)
}

export async function saveCategories(categories) {
  await set(KEYS.categories, categories)
}

export async function saveSettings(settings) {
  await set(KEYS.settings, settings)
}

// 「保存領域を消さないで」と OS にお願いする（消えにくくする）
export async function requestPersist() {
  if (navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist()
    } catch {
      return false
    }
  }
  return false
}
