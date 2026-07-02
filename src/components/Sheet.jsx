// 画面下から出てくるボトムシートの共通枠
// 背景タップで onClose。中身は children で渡す
export default function Sheet({ title, onClose, zIndex, children }) {
  return (
    <div
      className="sheet-backdrop"
      style={zIndex ? { zIndex } : undefined}
      onClick={(e) => {
        // シートを重ねたとき、下のシートまで一緒に閉じないようにする
        e.stopPropagation()
        onClose()
      }}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {title && <h2 className="sheet-title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
