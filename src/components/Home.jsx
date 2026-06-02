import {
  formatYen,
  todayStr,
  toDateStr,
  parseDateStr,
  startOfWeek,
  startOfMonth,
  WEEKDAYS,
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

  return (
    <div>
      <header className="home-head">
        <p className="home-date">{formatDateJa(today)}</p>
        <p className="today-label">今日の支出</p>
        <p key={todayTotal} className={'today-total' + (over ? ' over' : '')}>
          {formatYen(todayTotal)}
        </p>
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
