import { useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { formatYen, toDateStr, todayStr } from '../utils'
import ExpenseList from './ExpenseList'

ChartJS.register(ArcElement, Tooltip, Legend)

// マネーフォワード風の月次レポート（月送り＋収支ヘッダー＋ドーナツ＋カテゴリ内訳）
export default function MonthlyReport({
  expenses,
  categories,
  settings,
  onEdit,
  onDelete,
}) {
  const [offset, setOffset] = useState(0) // 0=今月, -1=先月…
  const [selCatId, setSelCatId] = useState(null)

  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const y = base.getFullYear()
  const m = base.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  const startStr = toDateStr(base)
  const endStr = toDateStr(new Date(y, m, lastDay))

  const monthExpenses = expenses.filter(
    (e) => e.date >= startStr && e.date <= endStr,
  )
  const total = monthExpenses.reduce((a, e) => a + e.amount, 0)

  const budget = settings?.dailyBudget || 0
  const monthBudget = budget * lastDay
  const remain = monthBudget - total

  const byCat = categories
    .map((c) => ({
      c,
      total: monthExpenses
        .filter((e) => e.categoryId === c.id)
        .reduce((a, e) => a + e.amount, 0),
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)

  const donutData = {
    labels: byCat.map((x) => x.c.name),
    datasets: [
      {
        data: byCat.map((x) => x.total),
        backgroundColor: byCat.map((x) => x.c.color),
        borderWidth: 0,
      },
    ],
  }
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}: ${formatYen(ctx.parsed)}` },
      },
    },
  }

  const selCat = selCatId ? categories.find((c) => c.id === selCatId) : null
  const selExpenses = selCat
    ? monthExpenses
        .filter((e) => e.categoryId === selCat.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : []
  const selTotal = selExpenses.reduce((a, e) => a + e.amount, 0)

  return (
    <div>
      <h1 className="page-title">月次レポート</h1>

      <div className="chart-card month-head">
        <div className="month-nav">
          <button
            className="month-nav-btn"
            onClick={() => setOffset(offset - 1)}
            aria-label="前の月"
          >
            ‹
          </button>
          <div className="month-title">
            <b>
              {y}年{m + 1}月
            </b>
            <span>
              {m + 1}月1日〜{m + 1}月{lastDay}日
            </span>
          </div>
          <button
            className="month-nav-btn"
            disabled={offset === 0}
            onClick={() => setOffset(offset + 1)}
            aria-label="次の月"
          >
            ›
          </button>
        </div>

        {budget > 0 ? (
          <div className="mf-equation">
            <div className="mf-eq-item">
              <span>目安</span>
              <b>{formatYen(monthBudget)}</b>
            </div>
            <span className="mf-op">−</span>
            <div className="mf-eq-item">
              <span>支出</span>
              <b className="mf-red">{formatYen(total)}</b>
            </div>
            <span className="mf-op">=</span>
            <div className="mf-eq-item">
              <span>残り</span>
              <b className={remain < 0 ? 'mf-red' : 'mf-blue'}>
                {formatYen(remain)}
              </b>
            </div>
          </div>
        ) : (
          <div className="mf-equation">
            <div className="mf-eq-item">
              <span>支出</span>
              <b className="mf-red">{formatYen(total)}</b>
            </div>
          </div>
        )}
      </div>

      {byCat.length === 0 ? (
        <p className="empty">この月の記録はありません</p>
      ) : (
        <>
          <section className="chart-card">
            <div className="chart-box donut">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </section>

          <section className="chart-card">
            <h2 className="section-title">カテゴリ別</h2>
            <ul className="mf-list">
              {byCat.map((x) => (
                <li key={x.c.id}>
                  <button
                    className="mf-row"
                    onClick={() => setSelCatId(x.c.id)}
                  >
                    <span
                      className="mf-icon"
                      style={{ background: x.c.color }}
                    >
                      {x.c.icon}
                    </span>
                    <span className="mf-name">{x.c.name}</span>
                    <span className="mf-amt">
                      <b>{formatYen(x.total)}</b>
                      <span className="mf-pct">
                        {((x.total / total) * 100).toFixed(1)}%
                      </span>
                    </span>
                    <span className="mf-chev">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {selCat && (
        <div className="sheet-backdrop" onClick={() => setSelCatId(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">
              {selCat.icon} {selCat.name}（{m + 1}月）
            </h2>
            <p className="day-total">{formatYen(selTotal)}</p>
            {selExpenses.length === 0 ? (
              <p className="empty">記録はありません</p>
            ) : (
              <ExpenseList
                expenses={selExpenses}
                categories={categories}
                showDate
                onEdit={(exp) => {
                  setSelCatId(null)
                  onEdit(exp)
                }}
                onDelete={onDelete}
              />
            )}
            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: 14 }}
              onClick={() => setSelCatId(null)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
