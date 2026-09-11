import React, { useMemo, useState } from 'react'
import Sheet from '../components/Sheet.jsx'
import { Icon } from '../components/Icons.jsx'
import { uid } from '../lib/workout.js'

const BASE_CATEGORIES = ['Push', 'Pull', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Rehab', 'Cardio', 'Other']
const BASE_EQUIPMENT = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'EZ Bar', 'Bodyweight', 'Kettlebell', 'Other']

const FILTERS = [['all', 'All'], ['active', 'Active'], ['inactive', 'Hidden']]

function withExisting(base, values){
  const extra = values.filter(v => v && !base.includes(v))
  return [...base, ...new Set(extra)]
}

export default function Exercises({ db, api, notify }){
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)

  const categories = useMemo(() => withExisting(BASE_CATEGORIES, db.exercises.map(e => e.category)), [db.exercises])
  const equipment = useMemo(() => withExisting(BASE_EQUIPMENT, db.exercises.map(e => e.equipment)), [db.exercises])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = db.exercises
      .filter(e => filter === 'all' || (filter === 'active' ? e.isActive !== false : e.isActive === false))
      .filter(e => !q || e.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
    const map = new Map()
    for (const e of list){
      const c = e.category || 'Other'
      if (!map.has(c)) map.set(c, [])
      map.get(c).push(e)
    }
    return Array.from(map.entries()).sort(([a], [b]) => categories.indexOf(a) - categories.indexOf(b))
  }, [db.exercises, query, filter, categories])

  const isNew = editing ? !db.exercises.some(e => e.id === editing.id) : false

  function startAdd(){
    setEditing({ id: uid(), name: '', category: 'Other', equipment: 'Other', isActive: true, createdAt: new Date().toISOString() })
  }

  function save(e){
    e.preventDefault()
    const name = editing.name.trim()
    if (!name) return
    const clash = db.exercises.some(x => x.id !== editing.id && x.name.trim().toLowerCase() === name.toLowerCase())
    if (clash){
      alert(`You already have an exercise called “${name}”.`)
      return
    }
    api.upsertExercise({ ...editing, name })
    setEditing(null)
    notify(isNew ? 'Exercise added' : 'Exercise saved')
  }

  function remove(){
    const msg = `Delete “${editing.name}”?\n\nPast workouts keep it, but it won’t be available for new ones. Hiding it instead keeps it in your library.`
    if (!confirm(msg)) return
    api.deleteExercise(editing.id)
    setEditing(null)
    notify('Exercise deleted')
  }

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <div className="eyebrow">{db.exercises.length} in your library</div>
          <h1 className="title-lg">Exercises</h1>
        </div>
        <button className="icon-btn icon-btn-accent" aria-label="New exercise" onClick={startAdd}>
          <Icon name="plus" />
        </button>
      </header>

      <div className="search">
        <Icon name="search" size={18} />
        <input type="search" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search exercises" />
      </div>

      <div className="segmented" role="group" aria-label="Filter exercises">
        {FILTERS.map(([key, label]) => (
          <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="card empty">
          <div className="empty-title">Nothing found</div>
          <div className="muted">Try a different search, or add a new exercise.</div>
        </div>
      )}

      {groups.map(([cat, list]) => (
        <section key={cat}>
          <div className="section-label">{cat}</div>
          <div className="list">
            {list.map(ex => (
              <button key={ex.id} className="list-row" onClick={() => setEditing({ ...ex })}>
                <span className="row-main">
                  <span className="row-title">{ex.name}</span>
                  <span className="row-sub">{ex.equipment || '—'}</span>
                </span>
                {ex.isActive === false && <span className="tag">Hidden</span>}
                <Icon name="chevronRight" size={18} className="faint" />
              </button>
            ))}
          </div>
        </section>
      ))}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'New exercise' : 'Edit exercise'} full>
        {editing && (
          <form className="vstack" onSubmit={save}>
            <label className="field">
              <span className="field-label">Name</span>
              <input
                className="input"
                value={editing.name}
                onChange={e => setEditing(v => ({ ...v, name: e.target.value }))}
                placeholder="e.g., Incline DB Press"
              />
            </label>

            <label className="field">
              <span className="field-label">Muscle group</span>
              <select className="input" value={editing.category || 'Other'} onChange={e => setEditing(v => ({ ...v, category: e.target.value }))}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Equipment</span>
              <select className="input" value={editing.equipment || 'Other'} onChange={e => setEditing(v => ({ ...v, equipment: e.target.value }))}>
                {equipment.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <div className="toggle-row">
              <div className="row-main">
                <div className="row-title">Show when logging</div>
                <div className="row-sub">Hidden exercises stay in your history.</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={editing.isActive !== false}
                aria-label="Show when logging"
                className="switch"
                onClick={() => setEditing(v => ({ ...v, isActive: v.isActive === false }))}
              />
            </div>

            <button className="btn btn-primary btn-lg btn-block" disabled={!editing.name.trim()}>Save</button>
            {!isNew && (
              <button type="button" className="btn btn-ghost btn-block danger-text" onClick={remove}>Delete exercise</button>
            )}
          </form>
        )}
      </Sheet>
    </div>
  )
}
