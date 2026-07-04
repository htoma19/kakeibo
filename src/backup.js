import { SCHEMA_VERSION } from './db'
import { parseDateStr, firstExpenseDate } from './utils'

export function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

// 全データを JSON ファイルとして書き出す（復元用バックアップ）
export function exportBackupJSON(expenses, categories, settings) {
  const data = {
    app: 'kakeibo',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    expenses,
    categories,
    settings,
  }
  downloadFile(
    JSON.stringify(data, null, 2),
    `kakeibo-backup-${stamp()}.json`,
    'application/json',
  )
}

// --- 復元データの検証 ---
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const COLOR_RE = /^#[0-9a-fA-F]{6}$/

// バックアップ JSON の中身を検証し、想定している項目と型だけを取り込む。
// 壊れたファイルや細工されたファイルを復元してもアプリが壊れないようにする
export function sanitizeBackup(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.expenses)) {
    throw new Error('支出データが見つかりません')
  }

  const expenses = data.expenses
    .filter((e) => e && typeof e === 'object')
    .map((e, i) => ({
      id: typeof e.id === 'string' ? e.id : `restored-${Date.now()}-${i}`,
      amount: Math.round(Number(e.amount)) || 0,
      categoryId: typeof e.categoryId === 'string' ? e.categoryId : '',
      memo: typeof e.memo === 'string' ? e.memo : '',
      date: typeof e.date === 'string' && DATE_RE.test(e.date) ? e.date : '',
      createdAt: typeof e.createdAt === 'string' ? e.createdAt : '',
    }))
    .filter((e) => e.date && e.amount > 0)

  // categories / settings は無い場合もある（その場合は現状維持で復元）
  const categories = Array.isArray(data.categories)
    ? data.categories
        .filter(
          (c) =>
            c &&
            typeof c === 'object' &&
            typeof c.name === 'string' &&
            c.name.trim(),
        )
        .map((c, i) => ({
          id: typeof c.id === 'string' ? c.id : `c-restored-${i}`,
          name: c.name.trim().slice(0, 20),
          icon: typeof c.icon === 'string' && c.icon ? c.icon.slice(0, 8) : '📦',
          color:
            typeof c.color === 'string' && COLOR_RE.test(c.color)
              ? c.color
              : '#94a3b8',
          order: i,
        }))
    : null

  let settings = null
  if (data.settings && typeof data.settings === 'object') {
    const num = (v) => {
      const n = Math.round(Number(v))
      return Number.isFinite(n) && n >= 0 ? n : 0
    }
    settings = {
      dailyBudget: num(data.settings.dailyBudget),
      hourlyWage: num(data.settings.hourlyWage),
    }
    if (typeof data.settings.lastBackupAt === 'string') {
      settings.lastBackupAt = data.settings.lastBackupAt
    }
    if (typeof data.settings.backupSnoozedAt === 'string') {
      settings.backupSnoozedAt = data.settings.backupSnoozedAt
    }
  }

  return { expenses, categories, settings }
}

const DAY = 86400000

// バックアップを促すべきか判定
// - 記録が無いうちは促さない
// - 「あとで」から7日間は出さない
// - 一度もバックアップしていない場合: 記録開始から7日経ったら促す
// - バックアップ済みの場合: 前回から30日経ったら促す
export function backupReminderDue(expenses, settings, now = new Date()) {
  if (!expenses.length) return false
  const snoozed = settings.backupSnoozedAt
    ? new Date(settings.backupSnoozedAt)
    : null
  if (snoozed && now - snoozed < 7 * DAY) return false
  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt) : null
  if (!last) {
    const first = firstExpenseDate(expenses)
    return now - parseDateStr(first) >= 7 * DAY
  }
  return now - last >= 30 * DAY
}
