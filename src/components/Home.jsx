import {
  formatYen,
  todayStr,
  toDateStr,
  parseDateStr,
  startOfWeek,
  startOfMonth,
  WEEKDAYS,
  daysInclusive,
  firstExpenseDate,
  formatHours,
  underBudgetStreak,
} from '../utils'
import ExpenseList from './ExpenseList'

export default function Home({ expenses, categories, settings, onEdit, onDelete }) {
  const today = todayStr()

  const todayExpenses = expenses
    .filter((e) => e.date === today)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  const todayTotal = todayExpenses.reduce((a, e) => a + e.amount, 0)

  const weekStart = toDateStr(startOfWeek())
  const weekTotal = expenses
    .filter((e) => e.date >= weekStart && e.date <= today)
    .reduce((a, e) => a + e.amount, 0)

  const monthStart = toDateStr(startOfMonth())
  const monthTotal = expenses
    .filter((e) => e.date >= monthStart && e.date <= today)
    .reduce((a, e) => a + e.amount, 0)

  const budget = settings.dailyBudget || 0
  const remaining = budget - todayTotal
  const over = budget > 0 && remaining < 0

  // 今月、目安より「浮いた額」（記録開始日 or 月初〜今日）
  let saved = null
  if (budget > 0) {
    const first = firstExpenseDate(expenses)
    const startStr = first && first > monthStart ? first : monthStart
    if (startStr <= today) {
      const elapsed = daysInclusive(startStr, today)
      const spent = expenses
        .filter((e) => e.date >= startStr && e.date <= today)
        .reduce((a, e) => a + e.amount, 0)
      saved = elapsed * budget - spent
    }
  }

  const wage = settings.hourlyWage || 0
  const todayHours = formatHours(todayTotal, wage)
  const streak = underBudgetStreak(
    expenses,
    budget,
    today,
    firstExpenseDate(expenses),
  )

  return (
    <div>
      <header className="home-head">
        <p className="home-date">{formatDateJa(today)}</p>
        <p className="today-label">今日の支出</p>
        <p key={todayTotal} className={'today-total' + (over ? ' over' : '')}>
          {formatYen(todayTotal)}
        </p>
        {todayHours && todayTotal > 0 && (
          <p className="today-hours">⏱ 約 {todayHours}の労働</p>
        )}
        {budget > 0 && (
          <>
            <p className={'budget-line' + (over ? ' over' : '')}>
              目安 {formatYen(budget)} ／{' '}
              {over
                ? `${formatYen(-remaining)} オーバー`
                : `あと ${formatYen(remaining)}`}
            </p>
            <div className="budget-bar">
              <div
                className="budget-bar-fill"
                style={{
                  width: Math.min(100, (todayTotal / budget) * 100) + '%',
                  background: over ? 'var(--danger)' : 'var(--accent)',
                }}
              />
            </div>
          </>
        )}
        {streak >= 2 && (
          <p className="streak-badge">🔥 {streak}日連続 目安以内！</p>
        )}
      </header>

      <div className="mini-stats">
        <div className="mini-stat">
          <span className="mini-stat-label">今週</span>
          <span className="mini-stat-value">{formatYen(weekTotal)}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">今月</span>
          <span className="mini-stat-value">{formatYen(monthTotal)}</span>
        </div>
      </div>

      {saved !== null && (
        <div className="saved-card">
          <span className="saved-label">今月、目安より</span>
          <span className={'saved-amount' + (saved < 0 ? ' over' : '')}>
            {saved >= 0
              ? `💰 ${formatYen(saved)} 浮いた`
              : `${formatYen(-saved)} 超過`}
          </span>
        </div>
      )}

      <section>
        <h2 className="section-title">今日の記録</h2>
        {todayExpenses.length === 0 ? (
          <p className="empty">
            まだ記録がありません。
            <br />
            右下の ＋ から追加しましょう。
          </p>
        ) : (
          <ExpenseList
            expenses={todayExpenses}
            categories={categories}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </section>
    </div>
  )
}

function formatDateJa(str) {
  const date = parseDateStr(str)
  return `${date.getMonth() + 1}月${date.getDate()}日(${WEEKDAYS[date.getDay()]})`
}
