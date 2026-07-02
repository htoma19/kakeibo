import { formatYen, formatDateJa, sumAmount, sortNewestFirst } from '../utils'
import ExpenseList from './ExpenseList'
import Sheet from './Sheet'

// カレンダーの日付をタップしたとき、その日の明細を表示するシート
export default function DayDetailSheet({
  date,
  expenses,
  categories,
  onEdit,
  onDelete,
  onClose,
}) {
  const dayExpenses = sortNewestFirst(expenses.filter((e) => e.date === date))
  const total = sumAmount(dayExpenses)

  return (
    <Sheet title={formatDateJa(date)} onClose={onClose}>
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

      <button className="btn-secondary sheet-close-btn" onClick={onClose}>
        閉じる
      </button>
    </Sheet>
  )
}
