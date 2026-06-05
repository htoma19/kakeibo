import { useState } from 'react'

const EMOJI_CHOICES = [
  '🍚', '🍜', '🍞', '🍱', '🥗', '🍣', '🍕', '🍰',
  '☕️', '🧋', '🍺', '🍷', '🛒', '🛍️', '👕', '👟',
  '💄', '🧴', '🧻', '🚃', '🚗', '🚕', '🚌', '🚲',
  '✈️', '⛽️', '🏠', '💡', '💧', '🔌', '📶', '🧾',
  '💳', '💰', '💊', '🏥', '🦷', '🏋️', '💆', '💇',
  '🎮', '🎬', '📚', '🎵', '🎨', '⚽️', '🎁', '📦',
  '🐶', '🐱', '👶', '🌸', '📱', '💻', '✏️', '💼',
]
const COLOR_CHOICES = [
  '#ef4444', '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1',
  '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16',
  '#eab308', '#f59e0b', '#f97316', '#fb7185', '#78716c', '#64748b', '#94a3b8',
]

export default function CategoryEditSheet({
  initial,
  usedCount = 0,
  onClose,
  onSave,
  onDelete,
}) {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || '📦')
  const [color, setColor] = useState(initial?.color || COLOR_CHOICES[0])
  const [confirming, setConfirming] = useState(false)

  const canSave = name.trim().length > 0

  function save() {
    if (!canSave) return
    onSave({ ...(initial || {}), name: name.trim(), icon, color })
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">
          {isEdit ? 'カテゴリを編集' : 'カテゴリを追加'}
        </h2>

        <div className="cat-preview">
          <span className="expense-icon" style={{ background: color + '22' }}>
            {icon}
          </span>
          <span style={{ fontWeight: 600 }}>{name.trim() || 'カテゴリ名'}</span>
        </div>

        <input
          className="memo-input"
          type="text"
          placeholder="カテゴリ名"
          value={name}
          maxLength={12}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <p className="picker-label">アイコン</p>
        <div className="emoji-grid">
          {EMOJI_CHOICES.map((em) => (
            <button
              key={em}
              className={'emoji-opt' + (icon === em ? ' selected' : '')}
              onClick={() => setIcon(em)}
            >
              {em}
            </button>
          ))}
        </div>
        <input
          className="emoji-free"
          type="text"
          value={icon}
          maxLength={8}
          onChange={(e) => setIcon(e.target.value)}
          aria-label="絵文字を直接入力"
        />
        <p className="picker-hint">
          ↑ キーボードの絵文字から、好きなものを直接入力もできます
        </p>

        <p className="picker-label">色</p>
        <div className="color-row">
          {COLOR_CHOICES.map((c) => (
            <button
              key={c}
              className={'color-opt' + (color === c ? ' selected' : '')}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label="色を選択"
            />
          ))}
        </div>
        <label className="color-custom">
          <span>好きな色を選ぶ</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>

        {isEdit && !confirming && (
          <button className="danger-btn" onClick={() => setConfirming(true)}>
            このカテゴリを削除
          </button>
        )}
        {isEdit && confirming && (
          <div className="confirm-box">
            <p className="note" style={{ textAlign: 'center' }}>
              {usedCount > 0
                ? `このカテゴリの記録 ${usedCount} 件は「不明」と表示されます。削除しますか？`
                : '本当に削除しますか？'}
            </p>
            <div className="confirm-row">
              <button className="btn-secondary" onClick={() => setConfirming(false)}>
                やめる
              </button>
              <button
                className="btn-primary"
                style={{ background: 'var(--danger)' }}
                onClick={() => {
                  onDelete(initial.id)
                  onClose()
                }}
              >
                削除する
              </button>
            </div>
          </div>
        )}

        <div className="sheet-actions">
          <button className="btn-secondary" onClick={onClose}>
            キャンセル
          </button>
          <button className="btn-primary" disabled={!canSave} onClick={save}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
