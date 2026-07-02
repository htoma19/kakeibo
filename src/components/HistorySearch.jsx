import { useMemo, useState } from 'react'
import { formatYen, todayStr, sumAmount, sortNewestFirst } from '../utils'
import ExpenseList from './ExpenseList'

export default function HistorySearch({ expenses, categories, onEdit, onDelete }) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState(todayStr())
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const min = parseInt(minAmount, 10) || 0
    const max = parseInt(maxAmount, 10) || 0

    return sortNewestFirst(
      expenses.filter((e) => {
        const cat = catMap[e.categoryId]
        const memo = (e.memo || '').toLowerCase()
        const catName = (cat?.name || '').toLowerCase()
        if (q && !memo.includes(q) && !catName.includes(q)) return false
        if (categoryId !== 'all' && e.categoryId !== categoryId) return false
        if (dateFrom && e.date < dateFrom) return false
        if (dateTo && e.date > dateTo) return false
        if (min > 0 && e.amount < min) return false
        if (max > 0 && e.amount > max) return false
        return true
      }),
    )
  }, [expenses, catMap, query, categoryId, dateFrom, dateTo, minAmount, maxAmount])

  const total = sumAmount(filtered)

  function clearFilters() {
    setQuery('')
    setCategoryId('all')
    setDateFrom('')
    setDateTo(todayStr())
    setMinAmount('')
    setMaxAmount('')
  }

  return (
    <div>
      <h1 className="page-title">履歴</h1>

      <section className="chart-card history-filter">
        <input
          className="memo-input"
          type="search"
          placeholder="メモ・カテゴリ名で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="history-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="all">すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <div className="filter-grid">
          <label>
            <span>開始日</span>
            <input
              className="date-input"
              type="date"
              value={dateFrom}
              max={dateTo || todayStr()}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label>
            <span>終了日</span>
            <input
              className="date-input"
              type="date"
              value={dateTo}
              max={todayStr()}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
          <label>
            <span>最小金額</span>
            <input
              className="date-input"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </label>
          <label>
            <span>最大金額</span>
            <input
              className="date-input"
              type="number"
              inputMode="numeric"
              placeholder="指定なし"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </label>
        </div>

        <div className="history-result-head">
          <span>
            {filtered.length}件 / {formatYen(total)}
          </span>
          <button type="button" className="text-btn" onClick={clearFilters}>
            条件をクリア
          </button>
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="empty">条件に合う記録はありません</p>
      ) : (
        <ExpenseList
          expenses={filtered}
          categories={categories}
          showDate
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}
