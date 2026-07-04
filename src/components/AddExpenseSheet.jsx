import { useState } from 'react'
import { formatYen, todayStr, formatHours } from '../utils'
import Sheet from './Sheet'

export default function AddExpenseSheet({
  categories,
  initial,
  todayTotal,
  hourlyWage,
  quickEntries = [],
  onClose,
  onSave,
  onSaveAndContinue,
}) {
  const today = todayStr()
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId || categories[0]?.id || '',
  )
  const [memo, setMemo] = useState(initial?.memo || '')
  const [date, setDate] = useState(initial?.date || today)
  const [catPickerOpen, setCatPickerOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(
    !!initial && (!!initial.memo || initial.date !== today),
  )

  const amountNum = parseInt(amount, 10) || 0
  const canSave = amountNum > 0 && categoryId
  const hours = formatHours(amountNum, hourlyWage)
  const selCat = categories.find((c) => c.id === categoryId)

  function pressKey(k) {
    setAmount((prev) => {
      if (k === 'del') return prev.slice(0, -1)
      const num = parseInt((prev || '') + k, 10) || 0
      return num > 9999999 ? prev : String(num)
    })
  }

  // 入力中の内容（金額・カテゴリ・メモ・日付）を保存用の形にまとめる
  function buildExpense() {
    return { amount: amountNum, categoryId, memo: memo.trim(), date }
  }

  function handleSave() {
    if (!canSave) return
    onSave({
      ...buildExpense(),
      id: initial?.id || String(Date.now()),
      createdAt: initial?.createdAt || new Date().toISOString(),
    })
  }

  function handleSaveAndContinue() {
    if (!canSave || !onSaveAndContinue) return
    onSaveAndContinue({
      ...buildExpense(),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    })
    setAmount('')
    setMemo('')
  }

  // 編集中の今日の支出は二重に数えないよう差し引く
  const baseToday =
    initial && initial.date === today ? todayTotal - initial.amount : todayTotal
  const projected = baseToday + (date === today ? amountNum : 0)

  return (
    <>
      <Sheet title={initial ? '記録を編集' : '支出を入力'} onClose={onClose}>
        {!initial && quickEntries.length > 0 && (
          <div className="quick-row">
            {quickEntries.map((q, i) => {
              const c = categories.find((x) => x.id === q.categoryId)
              return (
                <button
                  key={i}
                  type="button"
                  className="quick-chip"
                  onClick={() => {
                    setAmount(String(q.amount))
                    setCategoryId(q.categoryId)
                    setMemo(q.memo)
                  }}
                >
                  <span>{c?.icon || '📦'}</span>
                  <span className="quick-label">{q.memo || c?.name || ''}</span>
                  <b>{formatYen(q.amount)}</b>
                </button>
              )
            })}
          </div>
        )}

        <div className="amount-input-wrap">
          <span className="yen-sign">¥</span>
          <span className={'amount-display' + (amountNum === 0 ? ' empty' : '')}>
            {amountNum.toLocaleString('ja-JP')}
          </span>
        </div>

        {date === today && amountNum > 0 && (
          <p className="projected">
            今日の合計 {formatYen(baseToday)} → <b>{formatYen(projected)}</b>
          </p>
        )}
        {hours && amountNum > 0 && (
          <p className="hours-hint">⏱ あなたの時給で約 {hours}の労働</p>
        )}

        <div className="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'].map(
            (k) => (
              <button
                key={k}
                type="button"
                className={'keypad-btn' + (k === 'del' ? ' keypad-del' : '')}
                onClick={() => pressKey(k)}
              >
                {k === 'del' ? '⌫' : k}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="cat-trigger"
          onClick={() => setCatPickerOpen(true)}
        >
          {selCat ? (
            <>
              <span
                className="expense-icon"
                style={{ background: selCat.color + '22' }}
              >
                {selCat.icon}
              </span>
              <span className="cat-trigger-name">{selCat.name}</span>
            </>
          ) : (
            <span className="cat-trigger-name muted">カテゴリを選ぶ</span>
          )}
          <span className="cat-trigger-chev">›</span>
        </button>

        <button
          type="button"
          className="detail-toggle"
          onClick={() => setDetailsOpen((v) => !v)}
        >
          <span>{detailsOpen ? '詳細を閉じる' : 'メモ・日付を追加'}</span>
          <span>{detailsOpen ? '⌃' : '⌄'}</span>
        </button>

        {detailsOpen && (
          <div className="detail-panel">
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
              max={today}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}

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
          {!initial && (
            <button
              className="btn-primary btn-continue"
              disabled={!canSave}
              onClick={handleSaveAndContinue}
            >
              保存して続ける
            </button>
          )}
        </div>
      </Sheet>

      {catPickerOpen && (
        <Sheet
          title="カテゴリを選ぶ"
          zIndex={36}
          onClose={() => setCatPickerOpen(false)}
        >
          <ul className="cat-pick-list">
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  className={
                    'cat-pick-row' + (categoryId === c.id ? ' selected' : '')
                  }
                  onClick={() => {
                    setCategoryId(c.id)
                    setCatPickerOpen(false)
                  }}
                >
                  <span
                    className="expense-icon"
                    style={{ background: c.color + '22' }}
                  >
                    {c.icon}
                  </span>
                  <span className="cat-pick-name">{c.name}</span>
                  {categoryId === c.id && (
                    <span className="cat-pick-check">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </>
  )
}
