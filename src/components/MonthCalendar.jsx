// 金額を狭いセル向けに短く（例: 1,200 / 1.2万）
function compact(n) {
  if (n >= 10000) {
    const m = n / 10000
    return (Number.isInteger(m) ? m : m.toFixed(1)) + '万'
  }
  return n.toLocaleString('ja-JP')
}

// 金額に応じたセルの背景色（目安額超えは赤、それ以下は濃淡）
function cellStyle(amount, budget) {
  if (amount <= 0) return {}
  if (budget > 0) {
    if (amount > budget) return { background: 'rgba(255,46,58,0.55)' }
    const t = Math.min(1, amount / budget)
    return { background: `rgba(255,46,58,${0.12 + 0.35 * t})` }
  }
  const t = Math.min(1, amount / 5000)
  return { background: `rgba(255,46,58,${0.12 + 0.35 * t})` }
}

const WEEK_HEAD = ['月', '火', '水', '木', '金', '土', '日']

export default function MonthCalendar({
  expenses,
  year,
  month,
  budget,
  today,
  onSelectDay,
}) {
  const lastDate = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // 月曜=0

  const byDay = {}
  expenses.forEach((e) => {
    byDay[e.date] = (byDay[e.date] || 0) + e.amount
  })

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= lastDate; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const amount = byDay[ds] || 0
    cells.push({
      d,
      ds,
      amount,
      isToday: ds === today,
      isFuture: ds > today,
      over: budget > 0 && amount > budget,
    })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="cal">
      <div className="cal-head">
        {WEEK_HEAD.map((w) => (
          <span key={w} className="cal-hd">
            {w}
          </span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((c, i) =>
          c === null ? (
            <span key={i} className="cal-cell empty" />
          ) : (
            <button
              key={i}
              className={
                'cal-cell' +
                (c.isToday ? ' today' : '') +
                (c.isFuture ? ' future' : '')
              }
              style={cellStyle(c.amount, budget)}
              onClick={() => onSelectDay(c.ds)}
            >
              <span className="cal-day">{c.d}</span>
              {c.amount > 0 && (
                <span className={'cal-amt' + (c.over ? ' over' : '')}>
                  {compact(c.amount)}
                </span>
              )}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
