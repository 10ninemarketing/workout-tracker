import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

// iOS-style bottom sheet. `full` sheets reach the top of the screen so their
// inputs stay visible above the keyboard.
export default function Sheet({ open, onClose, title, full = false, children }){
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className={`sheet${full ? ' sheet-full' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        <div className="sheet-grabber" />
        <div className="sheet-head">
          <div className="sheet-title">{title}</div>
          <button className="btn-text" onClick={onClose}>Cancel</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body
  )
}
