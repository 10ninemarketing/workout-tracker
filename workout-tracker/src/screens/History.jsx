import React, { useMemo, useState } from 'react'
import { Icon } from '../components/Icons.jsx'
import { profileSessions, formatNumber, formatSet, setCount, plural } from '../lib/workout.js'

export default function History({ db, api, notify }){
  const sessions = useMemo(() => profileSessions(db), [db])
  const [openId, setOpenId] = useState(null)
  const units = db.settings.units

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
                    <div className="row-title">{en.exerciseName}</div>
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
    </div>
  )
}
