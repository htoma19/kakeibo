const ITEMS = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'review', label: '振り返り', icon: '📊' },
  { id: 'report', label: '月次', icon: '📅' },
  { id: 'settings', label: '設定', icon: '⚙️' },
]

export default function TabBar({ tab, setTab }) {
  return (
    <nav className="tabbar">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={'tab' + (tab === it.id ? ' active' : '')}
          onClick={() => setTab(it.id)}
        >
          <span className="tab-icon">{it.icon}</span>
          <span className="tab-label">{it.label}</span>
        </button>
      ))}
    </nav>
  )
}
