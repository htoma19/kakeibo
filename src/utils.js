// 金額を「¥1,200」形式に
export function formatYen(n) {
  return '¥' + Math.round(n).toLocaleString('ja-JP')
}

// Date を「YYYY-MM-DD」(ローカル時刻) に。
// toISOString() は UTC になり日付がずれるので使わない。
export function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 「YYYY-MM-DD」をローカルの Date に
export function parseDateStr(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayStr() {
  return toDateStr(new Date())
}

// 週の始まり（月曜始まり）
export function startOfWeek(d = new Date()) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // 月=0, 日=6
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

// よく使う支出（直近90日で2回以上登場した「金額×カテゴリ×メモ」の組）
// 入力シートのワンタップ候補に使う。登録不要で履歴から自動学習する
export function frequentEntries(expenses, limit = 6) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutStr = toDateStr(cutoff)
  const map = new Map()
  expenses.forEach((e) => {
    if (e.date < cutStr) return
    const key = `${e.categoryId}|${e.amount}|${e.memo || ''}`
    const cur = map.get(key)
    if (cur) {
      cur.count++
      if (e.date > cur.lastDate) cur.lastDate = e.date
    } else {
      map.set(key, {
        categoryId: e.categoryId,
        amount: e.amount,
        memo: e.memo || '',
        count: 1,
        lastDate: e.date,
      })
    }
  })
  return [...map.values()]
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate))
    .slice(0, limit)
}

// 2つの「YYYY-MM-DD」間の日数（両端含む）
export function daysInclusive(startStr, endStr) {
  const a = parseDateStr(startStr)
  const b = parseDateStr(endStr)
  return Math.floor((b - a) / 86400000) + 1
}

// 最も古い記録日（YYYY-MM-DD）。記録がなければ null
export function firstExpenseDate(expenses) {
  if (!expenses.length) return null
  return expenses.reduce((min, e) => (e.date < min ? e.date : min), expenses[0].date)
}

// 満足度タグ
export const MOODS = [
  { id: 'good', emoji: '😊', label: '満足' },
  { id: 'meh', emoji: '😐', label: 'ふつう' },
  { id: 'regret', emoji: '😞', label: '後悔' },
]
export const MOOD_EMOJI = { good: '😊', meh: '😐', regret: '😞' }

// 金額を時給で「労働時間」に換算（時給0なら null）
export function formatHours(amount, wage) {
  if (!wage || wage <= 0) return null
  const h = amount / wage
  if (h < 1) return `${Math.round(h * 60)}分`
  return `${h.toFixed(1)}時間`
}

// 目安以内が続く連続日数（今日から記録開始日まで遡る）
export function underBudgetStreak(expenses, budget, todayS, firstS) {
  if (!budget || budget <= 0 || !firstS) return 0
  const byDay = {}
  expenses.forEach((e) => {
    byDay[e.date] = (byDay[e.date] || 0) + e.amount
  })
  let streak = 0
  const cur = parseDateStr(todayS)
  const first = parseDateStr(firstS)
  while (cur >= first) {
    const spent = byDay[toDateStr(cur)] || 0
    if (spent <= budget) streak++
    else break
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}
