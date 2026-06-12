import { SCHEMA_VERSION } from './db'
import { parseDateStr } from './utils'

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
    const first = expenses.reduce(
      (min, e) => (e.date < min ? e.date : min),
      expenses[0].date,
    )
    return now - parseDateStr(first) >= 7 * DAY
  }
  return now - last >= 30 * DAY
}
