import { useRef, useState } from 'react'
import {
  exportBackupJSON,
  downloadFile,
  stamp,
  sanitizeBackup,
} from '../backup'
import CategoryEditSheet from './CategoryEditSheet'

// 表計算ソフトが先頭の = + - @ を数式と解釈しないようにする（CSVインジェクション対策）
function csvSafe(s) {
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s
}

// 「¥ + 数字入力 + 保存」の共通セクション（1日の目安額・時給で使用）
function MoneySection({ title, value, placeholder, note, onChange, onSave }) {
  return (
    <section className="settings-section">
      <h2 className="section-title">{title}</h2>
      <div className="budget-row">
        <span className="yen-sign" style={{ fontSize: '1.3rem' }}>
          ¥
        </span>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onSave}
        />
        <button
          className="btn-primary"
          style={{ flex: '0 0 auto', padding: '12px 18px' }}
          onClick={onSave}
        >
          保存
        </button>
      </div>
      <p className="note">{note}</p>
    </section>
  )
}

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
  const [wage, setWage] = useState(String(settings.hourlyWage || ''))
  const [catSheetOpen, setCatSheetOpen] = useState(false)
  const [catEditing, setCatEditing] = useState(null) // null = 追加モード

  // 入力欄の文字列を数値にして設定へ保存（空欄や数字以外は 0 扱い）
  function saveNumberSetting(key, raw) {
    onUpdateSettings({ ...settings, [key]: parseInt(raw, 10) || 0 })
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
    exportBackupJSON(expenses, categories, settings)
    onUpdateSettings({ ...settings, lastBackupAt: new Date().toISOString() })
  }

  function exportCSV() {
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
    const rows = [['日付', 'カテゴリ', '金額', 'メモ']]
    expenses
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((e) => {
        rows.push([
          e.date,
          csvSafe(catMap[e.categoryId] || '不明'),
          e.amount,
          csvSafe(e.memo || ''),
        ])
      })
    const csv =
      '﻿' +
      rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\r\n')
    downloadFile(csv, `kakeibo-${stamp()}.csv`, 'text/csv')
  }

  function handleImportFile(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        // 想定している項目・型だけを取り込む（壊れたファイル対策）
        const clean = sanitizeBackup(data)
        if (confirm('現在のデータをこのバックアップで置き換えます。よろしいですか？')) {
          onImport(clean)
          alert(`復元しました（記録 ${clean.expenses.length} 件）`)
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

      <MoneySection
        title="1日の目安額"
        value={budget}
        onChange={setBudget}
        onSave={() => saveNumberSetting('dailyBudget', budget)}
        note="ホーム画面の「あと◯◯円」やカレンダーの色に使われます。0 にすると非表示になります。"
      />

      <MoneySection
        title="時給（任意）"
        value={wage}
        placeholder="例: 1500"
        onChange={setWage}
        onSave={() => saveNumberSetting('hourlyWage', wage)}
        note="設定すると、支出を「労働◯時間分」に換算して表示します（入力画面・ホーム）。0 で非表示。"
      />

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
          最後のバックアップ:{' '}
          <b>
            {settings.lastBackupAt
              ? new Date(settings.lastBackupAt).toLocaleDateString('ja-JP')
              : 'まだありません'}
          </b>
        </p>
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
        <p className="data-info" style={{ marginTop: 4 }}>
          バージョン: {__BUILD_TIME__}
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

