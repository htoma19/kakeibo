import { formatYen, MOOD_EMOJI } from '../utils'

// 支出の一覧（ホーム・日別明細・月次で共通利用）
export default function ExpenseList({
  expenses,
  categories,
  onEdit,
  onDelete,
  showDate = false,
}) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  return (
    <ul className="expense-list">
      {expenses.map((e) => {
        const c = catMap[e.categoryId]
        return (
          <li key={e.id} className="expense-item" onClick={() => onEdit(e)}>
            <span
              className="expense-icon"
              style={{ background: (c?.color || '#94a3b8') + '22' }}
            >
              {c?.icon || '📦'}
            </span>
            <span className="expense-main">
              <span className="expense-cat">{c?.name || '不明'}</span>
              {(showDate || e.memo) && (
                <span className="expense-memo">
                  {showDate &&
                    `${Number(e.date.slice(5, 7))}/${Number(e.date.slice(8, 10))}`}
                  {showDate && e.memo && '・'}
                  {e.memo}
                </span>
              )}
            </span>
            {e.mood && (
              <span className="expense-mood">{MOOD_EMOJI[e.mood]}</span>
            )}
            <span className="expense-amount">{formatYen(e.amount)}</span>
            <button
              className="expense-del"
              aria-label="削除"
              onClick={(ev) => {
                ev.stopPropagation()
                if (confirm('この記録を削除しますか？')) onDelete(e.id)
              }}
            >
              🗑
            </button>
          </li>
        )
      })}
    </ul>
  )
}
