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
