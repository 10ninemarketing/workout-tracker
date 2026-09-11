import React, { useMemo, useState } from 'react'
import { Icon } from '../components/Icons.jsx'
import ProgressChart from '../components/ProgressChart.jsx'
import {
  profileSessions, suggestNextTemplate, lastDoneByTemplate, splitTemplateLabel,
  templateSetCount, bestSet, shortDate, formatDate, formatNumber, formatSet, draftProgress, plural
} from '../lib/workout.js'

function greeting(){
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard({ db, profile, draft, startWorkout, setTab }){
  const sessions = useMemo(() => profileSessions(db), [db])
  const units = db.settings.units
  const [chosenId, setChosenId] = useState(null)
  const [showAllBests, setShowAllBests] = useState(false)
  const [showNumbers, setShowNumbers] = useState(false)

  const next = useMemo(() => suggestNextTemplate(sessions), [sessions])
  const lastDone = useMemo(() => lastDoneByTemplate(sessions), [sessions])

  const week = useMemo(() => {
    const trained = new Set(sessions.map(s => formatDate(s.dateIso)))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setHours(12, 0, 0, 0)
      d.setDate(d.getDate() - (6 - i))
      const key = formatDate(d.toISOString())
      return {
        key,
        letter: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        on: trained.has(key),
        today: i === 6
      }
    })
  }, [sessions])

  const weekStats = useMemo(() => {
    const keys = new Set(week.map(d => d.key))
    const recent = sessions.filter(s => keys.has(formatDate(s.dateIso)))
    return {
      workouts: recent.length,
      sets: recent.reduce((n, s) => n + s.entries.reduce((m, e) => m + e.sets.length, 0), 0),
      volume: recent.reduce((n, s) => n + (s.totalVolume || 0), 0)
    }
  }, [sessions, week])

  // Oldest first, so a tied best keeps the date you first hit it
  const oldestFirst = useMemo(() => sessions.slice().reverse(), [sessions])

  const bests = useMemo(() => {
    const map = new Map()
    for (const s of oldestFirst){
      for (const e of s.entries){
        const b = bestSet(e.sets)
        if (!b) continue
        const cur = map.get(e.exerciseId)
        if (!cur || b.weight > cur.weight || (b.weight === cur.weight && b.reps > cur.reps)){
          map.set(e.exerciseId, { ...b, exerciseId: e.exerciseId, name: e.exerciseName, dateIso: s.dateIso })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1))
  }, [oldestFirst])

  const trackable = useMemo(() => {
    const map = new Map()
    for (const s of oldestFirst){
      for (const e of s.entries){
        const b = bestSet(e.sets)
        if (!b) continue
        if (!map.has(e.exerciseId)) map.set(e.exerciseId, { id: e.exerciseId, name: e.exerciseName, points: [] })
        map.get(e.exerciseId).points.push({ dateIso: s.dateIso, ...b })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name))
  }, [oldestFirst])

  const selected = trackable.find(t => t.id === chosenId) || trackable[0] || null
  const points = selected?.points || []
  const byReps = points.length > 0 && points.every(p => p.weight === 0)
  const latest = points[points.length - 1]
  const first = points[0]
  const delta = latest && first ? (byReps ? latest.reps - first.reps : latest.weight - first.weight) : 0

  const shownBests = showAllBests ? bests : bests.slice(0, 5)
  const { eyebrow: nextDay, name: nextName } = splitTemplateLabel(next.label)
  const progress = draft ? draftProgress(draft) : null

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <div className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1 className="title-lg">{greeting()}, {profile.name}</h1>
        </div>
      </header>

      {draft ? (
        <button className="card card-accent resume" onClick={() => setTab('log')}>
          <span className="row-main">
            <span className="eyebrow accent-text"><span className="live-dot" aria-hidden="true" /> In progress</span>
            <span className="resume-title">{draft.title || 'Workout'}</span>
            <span className="row-sub">{progress.done} of {progress.total} sets logged</span>
          </span>
          <span className="fake-btn">Resume</span>
        </button>
      ) : (
        <button className="card card-accent resume" onClick={() => startWorkout(next)}>
          <span className="row-main">
            <span className="eyebrow accent-text">Up next · {nextDay}</span>
            <span className="resume-title">{nextName}</span>
            <span className="row-sub">
              {plural(next.items.length, 'exercise')} · {plural(templateSetCount(next), 'set')}
              {lastDone.get(next.label) ? ` · last done ${shortDate(lastDone.get(next.label))}` : ''}
            </span>
          </span>
          <span className="fake-btn"><Icon name="play" size={15} /> Start</span>
        </button>
      )}

      <section className="card">
        <div className="card-head"><div className="card-title">Last 7 days</div></div>
        <div className="week">
          {week.map(d => (
            <div key={d.key} className={`day${d.on ? ' on' : ''}${d.today ? ' today' : ''}`}>
              <span className="day-dot">{d.on && <Icon name="check" size={14} strokeWidth={3} />}</span>
              <span>{d.letter}</span>
            </div>
          ))}
        </div>
        <div className="stat-row">
          <div><div className="stat-value">{weekStats.workouts}</div><div className="stat-label">Workouts</div></div>
          <div><div className="stat-value">{weekStats.sets}</div><div className="stat-label">Sets</div></div>
          <div><div className="stat-value">{formatNumber(weekStats.volume)}</div><div className="stat-label">Volume ({units})</div></div>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><div className="card-title">Progress</div></div>

        {!selected ? (
          <div className="empty muted">Finish a workout and your top sets show up here.</div>
        ) : (
          <div className="vstack">
            <select className="input" value={selected.id} onChange={e => setChosenId(e.target.value)} aria-label="Exercise to chart">
              {trackable.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <div className="chart-summary">
              <div>
                <div className="chart-value">{formatSet(latest)}</div>
                <div className="stat-label">Top set · {shortDate(latest.dateIso)}</div>
              </div>
              {points.length > 1 && delta !== 0 && (
                <span className={`delta${delta > 0 ? ' up' : ''}`}>
                  {delta > 0 ? '+' : ''}{delta} {byReps ? 'reps' : units}
                </span>
              )}
            </div>

            <ProgressChart points={points} units={units} metric={byReps ? 'reps' : 'weight'} />

            <button className="btn btn-ghost btn-sm" onClick={() => setShowNumbers(v => !v)}>
              {showNumbers ? 'Hide numbers' : 'Show numbers'}
            </button>

            {showNumbers && (
              <table className="mini-table">
                <tbody>
                  {points.slice().reverse().map((p, i) => (
                    <tr key={i}>
                      <td>{shortDate(p.dateIso)}</td>
                      <td className="num">{formatSet(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {bests.length > 0 && (
        <section>
          <div className="section-label">Best sets</div>
          <div className="list">
            {shownBests.map(b => (
              <div key={b.exerciseId} className="list-row">
                <span className="row-main">
                  <span className="row-title">{b.name}</span>
                  <span className="row-sub">{shortDate(b.dateIso)}</span>
                </span>
                <span className="best-value num">{formatSet(b)}</span>
              </div>
            ))}
          </div>
          {bests.length > 5 && (
            <button className="btn btn-ghost btn-block btn-sm" onClick={() => setShowAllBests(v => !v)}>
              {showAllBests ? 'Show less' : `Show all ${bests.length}`}
            </button>
          )}
        </section>
      )}
    </div>
  )
}
