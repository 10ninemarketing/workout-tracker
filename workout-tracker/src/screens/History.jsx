import React, { useMemo, useState } from 'react'
import { Icon } from '../components/Icons.jsx'
import Sheet from '../components/Sheet.jsx'
import { profileSessions, formatNumber, formatSet, setCount, plural } from '../lib/workout.js'

export default function History({ db, api, notify }){
  const sessions = useMemo(() => profileSessions(db), [db])
  const [openId, setOpenId] = useState(null)
  // { session, index } while an entry is being pointed at a different exercise
  const [fixing, setFixing] = useState(null)
  const units = db.settings.units

  // Log the wrong exercise and the sets are still right - only the name on
  // them is wrong. Deleting the workout to fix one row throws away the rest.
  function reassign(ex){
    const { session, index } = fixing
    api.updateSession({
      id: session.id,
      entries: session.entries.map((en, i) => (
        i === index ? { ...en, exerciseId: ex.id, exerciseName: ex.name } : en
      ))
    })
    setFixing(null)
    notify(`Changed to ${ex.name}`)
  }

  function remove(s){
    if (!confirm('Delete this workout? This can’t be undone.')) return
    api.deleteSession(s.id)
    notify('Workout deleted')
  }

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <div className="eyebrow">{plural(sessions.length, 'workout')}</div>
          <h1 className="title-lg">History</h1>
        </div>
      </header>

      {sessions.length === 0 && (
        <div className="card empty">
          <div className="empty-title">No workouts yet</div>
          <div className="muted">Finished workouts show up here.</div>
        </div>
      )}

      {sessions.map(s => {
        const open = openId === s.id
        const d = new Date(s.dateIso)
        return (
          <section key={s.id} className="card session">
            <button className="session-summary" aria-expanded={open} onClick={() => setOpenId(open ? null : s.id)}>
              <span className="date-badge">
                <span>{d.toLocaleDateString(undefined, { month: 'short' })}</span>
                <strong>{d.getDate()}</strong>
              </span>
              <span className="row-main">
                <span className="row-title">{s.dayType || 'Workout'}</span>
                <span className="row-sub">
                  {d.toLocaleDateString(undefined, { weekday: 'long' })}{s.durationMin ? ` · ${s.durationMin} min` : ''}
                </span>
                <span className="row-sub">
                  {plural(s.entries.length, 'exercise')} · {plural(setCount(s), 'set')} · {formatNumber(s.totalVolume)} {units}
                </span>
              </span>
              <Icon name="chevronRight" size={20} className={`chevron${open ? ' open' : ''}`} />
            </button>

            {open && (
              <div className="session-detail">
                {s.notes && <p className="session-notes">{s.notes}</p>}
                {s.entries.map((en, i) => (
                  <div key={`${en.exerciseId}-${i}`} className="session-ex">
                    <div className="session-ex-head">
                      <div className="row-title">{en.exerciseName}</div>
                      <button
                        className="icon-btn icon-btn-sm"
                        onClick={() => setFixing({ session: s, index: i })}
                        aria-label={`Change ${en.exerciseName} to a different exercise`}
                      >
                        <Icon name="sliders" size={15} />
                      </button>
                    </div>
                    <div className="set-chips">
                      {en.sets.map((st, j) => <span key={j} className="chip">{formatSet(st)}</span>)}
                    </div>
                  </div>
                ))}
                <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>
                  <Icon name="trash" size={16} /> Delete workout
                </button>
              </div>
            )}
          </section>
        )
      })}

      <ExercisePicker
        open={!!fixing}
        current={fixing ? fixing.session.entries[fixing.index].exerciseName : ''}
        exercises={db.exercises}
        onClose={() => setFixing(null)}
        onPick={reassign}
      />
    </div>
  )
}

function ExercisePicker({ open, current, exercises, onClose, onPick }){
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const shown = exercises
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(e => !needle || `${e.name} ${e.category || ''}`.toLowerCase().includes(needle))

  return (
    <Sheet open={open} onClose={onClose} title="Change exercise" full>
      <p className="footnote">
        The sets stay exactly as you logged them. Only which exercise they
        belong to changes.
      </p>
      <div className="sheet-search">
        <div className="search">
          <Icon name="search" size={18} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search exercises" autoComplete="off" />
        </div>
      </div>
      <div className="list">
        {shown.map(e => (
          <button
            key={e.id}
            className="list-row row-btn row-main"
            onClick={() => onPick(e)}
            disabled={e.name === current}
          >
            <span className="row-title">{e.name}</span>
            <span className="row-sub">
              {e.name === current ? 'Logged as this' : [e.category, e.equipment].filter(Boolean).join(' · ')}
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
