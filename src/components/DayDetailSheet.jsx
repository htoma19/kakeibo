import { formatYen, parseDateStr, WEEKDAYS } from '../utils'
import ExpenseList from './ExpenseList'

// カレンダーの日付をタップしたとき、その日の明細を表示するシート
export default function DayDetailSheet({
  date,
  expenses,
  categories,
  onEdit,
  onDelete,
  onClose,
}) {
  const dayExpenses = expenses
    .filter((e) => e.date === date)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  const total = dayExpenses.reduce((a, e) => a + e.amount, 0)

  const d = parseDateStr(date)
  const title = `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]})`

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{title}</h2>
        <p className="day-total">{formatYen(total)}</p>

        {dayExpenses.length === 0 ? (
          <p className="empty">この日の記録はありません</p>
        ) : (
          <ExpenseList
            expenses={dayExpenses}
            categories={categories}
            onEdit={(exp) => {
              onClose()
              onEdit(exp)
            }}
            onDelete={onDelete}
          />
        )}

        <button
          className="btn-secondary"
          style={{ width: '100%', marginTop: 14 }}
          onClick={onClose}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
