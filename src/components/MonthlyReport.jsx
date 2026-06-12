import { useState } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatYen, toDateStr } from '../utils'
import ExpenseList from './ExpenseList'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
)

// マネーフォワード風レポート（月次/年次の切替・期間送り・目安−支出=残り・内訳）
export default function MonthlyReport({
  expenses,
  categories,
  settings,
  onEdit,
  onDelete,
}) {
  const [period, setPeriod] = useState('month') // 'month' | 'year'
  const [monthOffset, setMonthOffset] = useState(0) // 0=今月, -1=先月…
  const [yearOffset, setYearOffset] = useState(0) // 0=今年, -1=昨年…
  const [selCatId, setSelCatId] = useState(null)

  const now = new Date()
  const budget = settings?.dailyBudget || 0

  // 期間の範囲・タイトル・目安額を組み立て
  let startStr, endStr, titleMain, titleSub, periodBudget, offset, setOffset
  let y, m, lastDay
  if (period === 'month') {
    const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    y = base.getFullYear()
    m = base.getMonth()
    lastDay = new Date(y, m + 1, 0).getDate()
    startStr = toDateStr(base)
    endStr = toDateStr(new Date(y, m, lastDay))
    titleMain = `${y}年${m + 1}月`
    titleSub = `${m + 1}月1日〜${m + 1}月${lastDay}日`
    periodBudget = budget * lastDay
    offset = monthOffset
    setOffset = setMonthOffset
  } else {
    y = now.getFullYear() + yearOffset
    const daysInYear =
      (new Date(y, 11, 31) - new Date(y, 0, 1)) / 86400000 + 1
    startStr = `${y}-01-01`
    endStr = `${y}-12-31`
    titleMain = `${y}年`
    titleSub = `1月1日〜12月31日`
    periodBudget = budget * daysInYear
    offset = yearOffset
    setOffset = setYearOffset
  }

  const inRange = expenses.filter((e) => e.date >= startStr && e.date <= endStr)
  const total = inRange.reduce((a, e) => a + e.amount, 0)
  const remain = periodBudget - total

  const byCat = categories
    .map((c) => ({
      c,
      total: inRange
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

  // 年表示：月別合計の棒グラフ（タップでその月へ）
  const byMonth =
    period === 'year'
      ? Array.from({ length: 12 }, (_, i) => {
          const p = `${y}-${String(i + 1).padStart(2, '0')}`
          return inRange
            .filter((e) => e.date.startsWith(p))
            .reduce((a, e) => a + e.amount, 0)
        })
      : []
  const barData = {
    labels: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
    datasets: [{ data: byMonth, backgroundColor: '#0f766e', borderRadius: 4 }],
  }
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => formatYen(ctx.parsed.y) } },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => '¥' + v } } },
    onClick: (evt, elements) => {
      if (!elements.length) return
      const idx = elements[0].index
      const target = (y - now.getFullYear()) * 12 + (idx - now.getMonth())
      if (target <= 0) {
        setMonthOffset(target)
        setPeriod('month')
      }
    },
  }

  const selCat = selCatId ? categories.find((c) => c.id === selCatId) : null
  const selExpenses = selCat
    ? inRange
        .filter((e) => e.categoryId === selCat.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : []
  const selTotal = selExpenses.reduce((a, e) => a + e.amount, 0)
  const selTitle =
    period === 'month' ? `${m + 1}月` : `${y}年`

  return (
    <div>
      <h1 className="page-title">レポート</h1>

      <div className="seg">
        <button
          className={'seg-btn' + (period === 'month' ? ' active' : '')}
          onClick={() => setPeriod('month')}
        >
          月
        </button>
        <button
          className={'seg-btn' + (period === 'year' ? ' active' : '')}
          onClick={() => setPeriod('year')}
        >
          年
        </button>
      </div>

      <div className="chart-card month-head">
        <div className="month-nav">
          <button
            className="month-nav-btn"
            onClick={() => setOffset(offset - 1)}
            aria-label="前へ"
          >
            ‹
          </button>
          <div className="month-title">
            <b>{titleMain}</b>
            <span>{titleSub}</span>
          </div>
          <button
            className="month-nav-btn"
            disabled={offset === 0}
            onClick={() => setOffset(offset + 1)}
            aria-label="次へ"
          >
            ›
          </button>
        </div>

        {budget > 0 ? (
          <div className="mf-equation">
            <div className="mf-eq-item">
              <span>目安</span>
              <b>{formatYen(periodBudget)}</b>
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

      {period === 'year' && total > 0 && (
        <section className="chart-card">
          <h2 className="section-title">月別の支出（タップでその月へ）</h2>
          <div className="chart-box">
            <Bar data={barData} options={barOptions} />
          </div>
        </section>
      )}

      {byCat.length === 0 ? (
        <p className="empty">
          この{period === 'month' ? '月' : '年'}の記録はありません
        </p>
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
                  <button className="mf-row" onClick={() => setSelCatId(x.c.id)}>
                    <span className="mf-icon" style={{ background: x.c.color }}>
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
              {selCat.icon} {selCat.name}（{selTitle}）
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
