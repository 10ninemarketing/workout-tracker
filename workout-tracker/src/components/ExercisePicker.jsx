import React, { useEffect, useMemo, useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon } from './Icons.jsx'

export default function ExercisePicker({ open, onClose, title, exercises, usedIds, currentId, preferCategory, onPick, onCreate }){
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const q = query.trim().toLowerCase()

  const groups = useMemo(() => {
    const list = exercises
      .filter(e => e.isActive !== false)
      .filter(e => !q || e.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
    const map = new Map()
    for (const e of list){
      const c = e.category || 'Other'
      if (!map.has(c)) map.set(c, [])
      map.get(c).push(e)
    }
    // When swapping, the same muscle group comes first
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === preferCategory) return -1
      if (b === preferCategory) return 1
      return a.localeCompare(b)
    })
  }, [exercises, q, preferCategory])

  const exactMatch = exercises.some(e => e.name.trim().toLowerCase() === q)

  return (
    <Sheet open={open} onClose={onClose} title={title} full>
      <div className="search sheet-search">
        <Icon name="search" size={18} />
        <input
          type="search"
          placeholder="Search or create"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search exercises"
        />
      </div>

      {q && !exactMatch && (
        <div className="list picker-create">
          <button className="list-row" onClick={() => onCreate(query.trim())}>
            <span className="icon-chip"><Icon name="plus" size={18} /></span>
            <span className="row-main">
              <span className="row-title">Create “{query.trim()}”</span>
              <span className="row-sub">Adds it to your exercise library</span>
            </span>
          </button>
        </div>
      )}

      {groups.map(([cat, list]) => (
        <section key={cat} className="picker-group">
          <div className="section-label">
            {cat}{cat === preferCategory && !q ? ' · same muscle group' : ''}
          </div>
          <div className="list">
            {list.map(ex => {
              const used = usedIds.has(ex.id)
              return (
                <button key={ex.id} className="list-row" disabled={used} onClick={() => onPick(ex)}>
                  <span className="row-main">
                    <span className="row-title">{ex.name}</span>
                    <span className="row-sub">{ex.equipment || '—'}</span>
                  </span>
                  {used
                    ? <span className="tag">{ex.id === currentId ? 'Current' : 'In workout'}</span>
                    : <Icon name="plus" size={18} className="faint" />}
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {groups.length === 0 && !q && <div className="empty muted">No exercises in your library yet.</div>}
    </Sheet>
  )
}
