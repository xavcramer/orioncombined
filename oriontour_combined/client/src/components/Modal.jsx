import React, { useEffect } from 'react'

export default function Modal({ title, open, onClose, footer, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(920px, 100%)',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e7e7e7',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 14, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ border: '1px solid #ddd', background: '#fff', borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 14 }}>{children}</div>

        {footer ? (
          <div style={{ padding: 14, borderTop: '1px solid #eee', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
