import { useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  formatYen,
  todayStr,
  toDateStr,
  parseDateStr,
  startOfWeek,
  startOfMonth,
  WEEKDAYS,
} from '../utils'
import MonthCalendar from './MonthCalendar'
import DayDetailSheet from './DayDetailSheet'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
)

const GREEN = '#16a34a'

export default function Review({ expenses, categories, settings, onEdit, onDelete }) {
  const [period, setPeriod] = useState('week') // 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(null)
  const budget = settings?.dailyBudget || 0
  const now = new Date()

  const start = period === 'week' ? startOfWeek(now) : startOfMonth(now)
  const startStr = toDateStr(start)
  const endStr = todayStr()

  // 期間内の各日付（始まり〜今日）
  const days = []
  const cur = new Date(start)
  const end = parseDateStr(endStr)
  while (cur <= end) {
    days.push(toDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }

  const inRange = expenses.filter((e) => e.date >= startStr && e.date <= endStr)
  const total = inRange.reduce((a, e) => a + e.amount, 0)
  const elapsedDays = days.length
  const avg = elapsedDays ? total / elapsedDays : 0

  // 日別合計
  const byDay = days.map((d) =>
    inRange.filter((e) => e.date === d).reduce((a, e) => a + e.amount, 0),
  )

  // カテゴリ別合計（多い順）
  const byCat = categories
    .map((c) => ({
      c,
      total: inRange
        .filter((e) => e.categoryId === c.id)
        .reduce((a, e) => a + e.amount, 0),
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)

  // --- インサイト ---
  function sumRange(s, e) {
    return expenses
      .filter((x) => x.date >= s && x.date <= e)
      .reduce((a, x) => a + x.amount, 0)
  }

  // 前期間の「同時期（同じ経過日数）」の合計
  let prevTotal = 0
  if (period === 'week') {
    const ps = new Date(start)
    ps.setDate(ps.getDate() - 7)
    const pe = new Date(ps)
    pe.setDate(pe.getDate() + (elapsedDays - 1))
    prevTotal = sumRange(toDateStr(ps), toDateStr(pe))
  } else {
    const ps = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthLast = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
    const peDay = Math.min(elapsedDays, prevMonthLast)
    const pe = new Date(now.getFullYear(), now.getMonth() - 1, peDay)
    prevTotal = sumRange(toDateStr(ps), toDateStr(pe))
  }
  const diff = total - prevTotal

  // 目安以内だった日数
  const metDays = budget > 0 ? byDay.filter((v) => v <= budget).length : 0

  // 今月の着地予測
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const projected = Math.round(avg * daysInMonth)
  const monthlyBudget = budget > 0 ? budget * daysInMonth : 0

  const barData = {
    labels: days.map((d) => WEEKDAYS[parseDateStr(d).getDay()]),
    datasets: [{ data: byDay, backgroundColor: '#d97757', borderRadius: 4 }],
  }
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => formatYen(ctx.parsed.y) } },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => '¥' + v } } },
  }

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
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}: ${formatYen(ctx.parsed)}` },
      },
    },
  }

  return (
    <div>
      <h1 className="page-title">振り返り</h1>

      <div className="seg">
        <button
          className={'seg-btn' + (period === 'week' ? ' active' : '')}
          onClick={() => setPeriod('week')}
        >
          今週
        </button>
        <button
          className={'seg-btn' + (period === 'month' ? ' active' : '')}
          onClick={() => setPeriod('month')}
        >
          今月
        </button>
      </div>

      <div className="review-summary">
        <div>
          <span className="rs-label">合計</span>
          <span className="rs-value">{formatYen(total)}</span>
        </div>
        <div>
          <span className="rs-label">1日あたり</span>
          <span className="rs-value">{formatYen(avg)}</span>
        </div>
      </div>

      <section className="chart-card">
        <h2 className="section-title">
          {period === 'week' ? '今週のまとめ' : '今月のまとめ'}
        </h2>
        <div className="insights">
          <div className="insight">
            <span className="ins-label">
              {period === 'week' ? '先週同時期' : '先月同時期'}と比べて
            </span>
            <span className="ins-value">
              {diff === 0 ? (
                <span style={{ color: 'var(--muted)' }}>ほぼ同じ</span>
              ) : diff > 0 ? (
                <span style={{ color: 'var(--danger)' }}>
                  {formatYen(diff)} 多い ↑
                </span>
              ) : (
                <span style={{ color: GREEN }}>{formatYen(-diff)} 少ない ↓</span>
              )}
            </span>
          </div>
          <div className="insight-sub">
            {period === 'week' ? '先週' : '先月'}同時期は {formatYen(prevTotal)}
          </div>

          {budget > 0 && (
            <div className="insight">
              <span className="ins-label">目安以内だった日</span>
              <span className="ins-value">
                {metDays} / {elapsedDays} 日
              </span>
            </div>
          )}

          {period === 'month' && (
            <>
              <div className="insight">
                <span className="ins-label">このペースだと今月は</span>
                <span className="ins-value">約 {formatYen(projected)}</span>
              </div>
              {monthlyBudget > 0 && (
                <div className="insight-sub">
                  月の目安 {formatYen(monthlyBudget)}・
                  {projected <= monthlyBudget ? (
                    <span style={{ color: GREEN }}>目安以内のペース</span>
                  ) : (
                    <span style={{ color: 'var(--danger)' }}>
                      約 {formatYen(projected - monthlyBudget)} 超えるペース
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {period === 'week' ? (
        <section className="chart-card">
          <h2 className="section-title">日別の支出</h2>
          <div className="chart-box">
            <Bar data={barData} options={barOptions} />
          </div>
        </section>
      ) : (
        <section className="chart-card">
          <h2 className="section-title">{now.getMonth() + 1}月のカレンダー</h2>
          <MonthCalendar
            expenses={expenses}
            year={now.getFullYear()}
            month={now.getMonth()}
            budget={budget}
            today={endStr}
            onSelectDay={setSelectedDate}
          />
          <p className="note" style={{ marginTop: 10 }}>
            日付をタップすると、その日の明細が見られます。
            {budget > 0 && (
              <>
                {' '}色が濃い日ほど支出が多い日。
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>赤</span>
                は目安超え。
              </>
            )}
          </p>
        </section>
      )}

      <section className="chart-card">
        <h2 className="section-title">カテゴリ別</h2>
        {byCat.length === 0 ? (
          <p className="empty">この期間のデータはありません</p>
        ) : (
          <>
            <div className="chart-box donut">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
            <ul className="cat-rank">
              {byCat.map((x) => (
                <li key={x.c.id}>
                  <span className="dot" style={{ background: x.c.color }} />
                  <span className="cr-name">
                    {x.c.icon} {x.c.name}
                  </span>
                  <span className="cr-amount">{formatYen(x.total)}</span>
                  <span className="cr-pct">
                    {Math.round((x.total / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {selectedDate && (
        <DayDetailSheet
          date={selectedDate}
          expenses={expenses}
          categories={categories}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
