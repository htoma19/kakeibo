import { useEffect, useRef, useState } from 'react'
import {
  loadAll,
  saveExpenses,
  saveCategories,
  saveSettings,
  requestPersist,
} from './db'
import { todayStr } from './utils'
import { exportBackupJSON, backupReminderDue } from './backup'
import TabBar from './components/TabBar'
import Home from './components/Home'
import Review from './components/Review'
import MonthlyReport from './components/MonthlyReport'
import Settings from './components/Settings'
import AddExpenseSheet from './components/AddExpenseSheet'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [settings, setSettings] = useState({})
  const [tab, setTab] = useState('home')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    loadAll().then((data) => {
      setExpenses(data.expenses)
      setCategories(data.categories)
      setSettings(data.settings)
      setLoaded(true)
    })
    requestPersist()
  }, [])

  // キーボード表示時に入力シートが隠れないよう、見えている高さを CSS 変数(--kb)に反映
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      document.documentElement.style.setProperty('--kb', kb + 'px')
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1600)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  function upsertExpense(exp) {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === exp.id)
      const next = exists
        ? prev.map((e) => (e.id === exp.id ? exp : e))
        : [...prev, exp]
      saveExpenses(next)
      return next
    })
  }

  function deleteExpense(id) {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveExpenses(next)
      return next
    })
    showToast('削除しました')
  }

  function updateCategories(next) {
    setCategories(next)
    saveCategories(next)
  }

  function updateSettings(next) {
    setSettings(next)
    saveSettings(next)
  }

  function applyImport(data) {
    if (Array.isArray(data.expenses)) {
      setExpenses(data.expenses)
      saveExpenses(data.expenses)
    }
    if (Array.isArray(data.categories)) {
      setCategories(data.categories)
      saveCategories(data.categories)
    }
    if (data.settings) {
      setSettings(data.settings)
      saveSettings(data.settings)
    }
  }

  function doBackup() {
    exportBackupJSON(expenses, categories, settings)
    updateSettings({ ...settings, lastBackupAt: new Date().toISOString() })
    showToast('バックアップを書き出しました ✓')
  }

  function snoozeBackup() {
    updateSettings({ ...settings, backupSnoozedAt: new Date().toISOString() })
  }

  if (!loaded) return <div className="loading">読み込み中…</div>

  const backupDue = backupReminderDue(expenses, settings)

  const today = todayStr()
  const todayTotal = expenses
    .filter((e) => e.date === today)
    .reduce((a, e) => a + e.amount, 0)

  return (
    <div className="app">
      <main className="screen">
        {tab === 'home' && (
          <Home
            expenses={expenses}
            categories={categories}
            settings={settings}
            backupDue={backupDue}
            onBackup={doBackup}
            onSnoozeBackup={snoozeBackup}
            onEdit={(exp) => {
              setEditing(exp)
              setAdding(true)
            }}
            onDelete={deleteExpense}
          />
        )}
        {tab === 'review' && (
          <Review
            expenses={expenses}
            categories={categories}
            settings={settings}
            onEdit={(exp) => {
              setEditing(exp)
              setAdding(true)
            }}
            onDelete={deleteExpense}
          />
        )}
        {tab === 'report' && (
          <MonthlyReport
            expenses={expenses}
            categories={categories}
            settings={settings}
            onEdit={(exp) => {
              setEditing(exp)
              setAdding(true)
            }}
            onDelete={deleteExpense}
          />
        )}
        {tab === 'settings' && (
          <Settings
            expenses={expenses}
            categories={categories}
            settings={settings}
            onUpdateCategories={updateCategories}
            onUpdateSettings={updateSettings}
            onImport={applyImport}
          />
        )}
      </main>

      {tab !== 'settings' && (
        <button
          className="fab"
          onClick={() => {
            setEditing(null)
            setAdding(true)
          }}
          aria-label="支出を追加"
        >
          ＋
        </button>
      )}

      <TabBar tab={tab} setTab={setTab} />

      {adding && (
        <AddExpenseSheet
          categories={categories}
          initial={editing}
          todayTotal={todayTotal}
          hourlyWage={settings.hourlyWage || 0}
          onClose={() => setAdding(false)}
          onSave={(exp) => {
            const isEdit = !!editing
            upsertExpense(exp)
            setAdding(false)
            showToast(isEdit ? '更新しました' : '記録しました ✓')
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
