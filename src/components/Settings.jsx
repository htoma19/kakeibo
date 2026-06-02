import { useRef, useState } from 'react'
import { SCHEMA_VERSION } from '../db'
import CategoryEditSheet from './CategoryEditSheet'

export default function Settings({
  expenses,
  categories,
  settings,
  onUpdateCategories,
  onUpdateSettings,
  onImport,
}) {
  const fileRef = useRef(null)
  const [budget, setBudget] = useState(String(settings.dailyBudget ?? ''))
  const [catSheetOpen, setCatSheetOpen] = useState(false)
  const [catEditing, setCatEditing] = useState(null) // null = 追加モード

  function saveBudget() {
    const n = parseInt(budget, 10) || 0
    onUpdateSettings({ ...settings, dailyBudget: n })
  }

  function openAdd() {
    setCatEditing(null)
    setCatSheetOpen(true)
  }
  function openEdit(cat) {
    setCatEditing(cat)
    setCatSheetOpen(true)
  }

  function saveCategory(cat) {
    if (cat.id) {
      onUpdateCategories(categories.map((c) => (c.id === cat.id ? cat : c)))
    } else {
      onUpdateCategories([
        ...categories,
        { ...cat, id: 'c' + Date.now(), order: categories.length },
      ])
    }
    setCatSheetOpen(false)
  }

  function deleteCategory(id) {
    onUpdateCategories(categories.filter((c) => c.id !== id))
    setCatSheetOpen(false)
  }

  function move(cat, dir) {
    const idx = categories.findIndex((c) => c.id === cat.id)
    const j = idx + dir
    if (j < 0 || j >= categories.length) return
    const next = [...categories]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    onUpdateCategories(next.map((c, i) => ({ ...c, order: i })))
  }

  function exportJSON() {
    const data = {
      app: 'kakeibo',
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      expenses,
      categories,
      settings,
    }
    download(
      JSON.stringify(data, null, 2),
      `kakeibo-backup-${stamp()}.json`,
      'application/json',
    )
  }

  function exportCSV() {
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
    const rows = [['日付', 'カテゴリ', '金額', 'メモ']]
    expenses
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((e) => {
        rows.push([e.date, catMap[e.categoryId] || '不明', e.amount, e.memo || ''])
      })
    const csv =
      '﻿' +
      rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\r\n')
    download(csv, `kakeibo-${stamp()}.csv`, 'text/csv')
  }

  function handleImportFile(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.expenses)) throw new Error('支出データが見つかりません')
        if (confirm('現在のデータをこのバックアップで置き換えます。よろしいですか？')) {
          onImport(data)
          alert('復元しました')
        }
      } catch (err) {
        alert('読み込めませんでした: ' + err.message)
      }
    }
    reader.readAsText(file)
    ev.target.value = ''
  }

  const editingUsed = catEditing
    ? expenses.filter((e) => e.categoryId === catEditing.id).length
    : 0

  return (
    <div>
      <h1 className="page-title">設定</h1>

      <section className="settings-section">
        <h2 className="section-title">1日の目安額</h2>
        <div className="budget-row">
          <span className="yen-sign" style={{ fontSize: '1.3rem' }}>
            ¥
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onBlur={saveBudget}
          />
          <button
            className="btn-primary"
            style={{ flex: '0 0 auto', padding: '12px 18px' }}
            onClick={saveBudget}
          >
            保存
          </button>
        </div>
        <p className="note">
          ホーム画面の「あと◯◯円」やカレンダーの色に使われます。0
          にすると非表示になります。
        </p>
      </section>

      <section className="settings-section">
        <h2 className="section-title">カテゴリ</h2>
        <ul className="cat-edit-list">
          {categories.map((cat) => (
            <li key={cat.id} className="cat-row" onClick={() => openEdit(cat)}>
              <span
                className="expense-icon"
                style={{ background: cat.color + '22' }}
              >
                {cat.icon}
              </span>
              <span className="cat-row-name">{cat.name}</span>
              <button
                className="cat-move"
                onClick={(e) => {
                  e.stopPropagation()
                  move(cat, -1)
                }}
                aria-label="上へ"
              >
                ↑
              </button>
              <button
                className="cat-move"
                onClick={(e) => {
                  e.stopPropagation()
                  move(cat, 1)
                }}
                aria-label="下へ"
              >
                ↓
              </button>
              <span className="cat-row-edit">✏️</span>
            </li>
          ))}
        </ul>
        <button className="add-cat-btn" onClick={openAdd}>
          ＋ カテゴリを追加
        </button>
      </section>

      <section className="settings-section">
        <h2 className="section-title">バックアップ</h2>
        <button className="action-btn" onClick={exportJSON}>
          📥 バックアップを書き出す（JSON）
        </button>
        <button className="action-btn" onClick={exportCSV}>
          📄 CSVで書き出す（表計算ソフト用）
        </button>
        <button className="action-btn" onClick={() => fileRef.current?.click()}>
          ♻️ バックアップから復元（JSON）
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        <p className="note">
          <b>データはこのスマホ内だけに保存されています。</b>
          iOS はブラウザの保存領域を消すことがあるため、ときどき JSON
          を書き出して「ファイル」アプリや iCloud に保存しておくと安心です。
        </p>
      </section>

      <section className="settings-section">
        <h2 className="section-title">データ</h2>
        <p className="data-info">
          記録 {expenses.length} 件 ／ カテゴリ {categories.length} 件
        </p>
      </section>

      {catSheetOpen && (
        <CategoryEditSheet
          initial={catEditing}
          usedCount={editingUsed}
          onClose={() => setCatSheetOpen(false)}
          onSave={saveCategory}
          onDelete={deleteCategory}
        />
      )}
    </div>
  )
}

function download(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}
