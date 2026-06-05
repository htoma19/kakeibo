import { useState } from 'react'
import { formatYen, todayStr, formatHours, MOODS } from '../utils'

export default function AddExpenseSheet({
  categories,
  initial,
  todayTotal,
  hourlyWage,
  onClose,
  onSave,
}) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId || categories[0]?.id || '',
  )
  const [memo, setMemo] = useState(initial?.memo || '')
  const [date, setDate] = useState(initial?.date || todayStr())
  const [mood, setMood] = useState(initial?.mood || null)

  const amountNum = parseInt(amount, 10) || 0
  const canSave = amountNum > 0 && categoryId
  const hours = formatHours(amountNum, hourlyWage)

  function handleSave() {
    if (!canSave) return
    onSave({
      id: initial?.id || String(Date.now()),
      amount: amountNum,
      categoryId,
      memo: memo.trim(),
      date,
      mood,
      createdAt: initial?.createdAt || new Date().toISOString(),
    })
  }

  // 編集中の今日の支出は二重に数えないよう差し引く
  const baseToday =
    initial && initial.date === todayStr() ? todayTotal - initial.amount : todayTotal
  const projected = baseToday + (date === todayStr() ? amountNum : 0)

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{initial ? '記録を編集' : '支出を入力'}</h2>

        <div className="amount-input-wrap">
          <span className="yen-sign">¥</span>
          <input
            className="amount-input"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>

        {date === todayStr() && amountNum > 0 && (
          <p className="projected">
            今日の合計 {formatYen(baseToday)} → <b>{formatYen(projected)}</b>
          </p>
        )}
        {hours && amountNum > 0 && (
          <p className="hours-hint">⏱ あなたの時給で約 {hours}の労働</p>
        )}

        <div className="cat-chips">
          {categories.map((c) => {
            const selected = categoryId === c.id
            return (
              <button
                key={c.id}
                className={'chip' + (selected ? ' selected' : '')}
                style={
                  selected
                    ? {
                        background: c.color,
                        borderColor: c.color,
                        color: '#fff',
                        boxShadow: `0 3px 16px ${c.color}88`,
                      }
                    : { borderColor: c.color }
                }
                onClick={() => setCategoryId(c.id)}
              >
                {c.icon} {c.name}
              </button>
            )
          })}
        </div>

        <div className="mood-row">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={'mood-btn' + (mood === m.id ? ' selected' : '')}
              onClick={() => setMood(mood === m.id ? null : m.id)}
            >
              <span className="mood-emoji">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        <input
          className="memo-input"
          type="text"
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
        <input
          className="date-input"
          type="date"
          value={date}
          max={todayStr()}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="sheet-actions">
          <button className="btn-secondary" onClick={onClose}>
            キャンセル
          </button>
          <button
            className="btn-primary"
            disabled={!canSave}
            onClick={handleSave}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
