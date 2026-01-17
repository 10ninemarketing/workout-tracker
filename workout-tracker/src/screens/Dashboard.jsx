import React, { useMemo, useState } from 'react'
import { computeE1RM, formatDate } from '../storage/db.js'

function daysAgo(n){
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0,0,0,0)
  return d
}

function sum(arr){
  return arr.reduce((a,b)=>a+(Number(b)||0),0)
}

function isoFromDateInput(d){
  // d: YYYY-MM-DD
  if (!d) return ''
  return new Date(d + 'T12:00:00').toISOString()
}

function downloadBlob({ content, mime, filename }){
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCSV(rows){
  const esc = (v) => {
    const s = (v ?? '').toString()
    if (/[\n\r",]/.test(s)) return '"' + s.replaceAll('"','""') + '"'
    return s
  }
  return rows.map(r => r.map(esc).join(',')).join('\n')
}

export default function Dashboard({ db }){
  const activeProfileId = db.activeProfileId

  const sessions = useMemo(()=>{
    return db.sessions
      .filter(s=>s.profileId === activeProfileId)
      .slice()
      .sort((a,b)=> (a.dateIso < b.dateIso ? 1 : -1))
  }, [db.sessions, activeProfileId])

  const last7 = useMemo(()=>{
    const cutoff = daysAgo(6)
    return sessions.filter(s=> new Date(s.dateIso) >= cutoff)
  }, [sessions])

  const last7Volume = useMemo(()=>{
    const vols = []
    for (const s of last7){
      for (const e of s.entries){
        for (const set of e.sets){
          const w = Number(set.weight)||0
          const r = Number(set.reps)||0
          vols.push(w*r)
        }
      }
    }
    return sum(vols)
  }, [last7])

  const prs = useMemo(()=>{
    // Best e1RM per exercise
    const best = new Map()
    for (const s of sessions){
      for (const e of s.entries){
        for (const set of e.sets){
          const e1 = computeE1RM({ weight: set.weight, reps: set.reps, formula: db.settings.e1rmFormula })
          const cur = best.get(e.exerciseId)
          if (!cur || e1 > cur.e1rm){
            best.set(e.exerciseId, {
              exerciseId: e.exerciseId,
              exerciseName: e.exerciseName,
              e1rm: e1,
              dateIso: s.dateIso,
              weight: set.weight,
              reps: set.reps
            })
          }
        }
      }
    }
    return Array.from(best.values()).sort((a,b)=>b.e1rm - a.e1rm)
  }, [sessions, db.settings.e1rmFormula])

  const [selectedExerciseId, setSelectedExerciseId] = useState(prs[0]?.exerciseId || '')

  const trend = useMemo(()=>{
    if (!selectedExerciseId) return []
    const points = []
    for (const s of sessions.slice().reverse()){
      for (const e of s.entries){
        if (e.exerciseId !== selectedExerciseId) continue
        let bestSet = 0
        for (const set of e.sets){
          const e1 = computeE1RM({ weight: set.weight, reps: set.reps, formula: db.settings.e1rmFormula })
          if (e1 > bestSet) bestSet = e1
        }
        if (bestSet > 0){
          points.push({ date: formatDate(s.dateIso), e1rm: bestSet })
        }
      }
    }
    return points
  }, [sessions, selectedExerciseId, db.settings.e1rmFormula])

  // Export
  const today = formatDate(new Date().toISOString())
  const [exportStart, setExportStart] = useState(formatDate(daysAgo(6).toISOString()))
  const [exportEnd, setExportEnd] = useState(today)

  const exportSessions = useMemo(()=>{
    const a = isoFromDateInput(exportStart)
    const b = isoFromDateInput(exportEnd)
    if (!a || !b) return []
    const start = new Date(a)
    const end = new Date(b)
    end.setHours(23,59,59,999)
    return sessions.filter(s => {
      const d = new Date(s.dateIso)
      return d >= start && d <= end
    })
  }, [sessions, exportStart, exportEnd])

  function exportRangeJSON(){
    const payload = {
      exportedAt: new Date().toISOString(),
      units: db.settings.units,
      e1rmFormula: db.settings.e1rmFormula,
      profileId: activeProfileId,
      dateRange: { start: exportStart, end: exportEnd },
      sessions: exportSessions,
    }
    downloadBlob({
      content: JSON.stringify(payload, null, 2),
      mime: 'application/json',
      filename: `workouts-${exportStart}-to-${exportEnd}.json`
    })
  }

  function exportRangeCSV(){
    const header = ['date','dayType','exercise','set','weight','reps','rpe','e1rm','sessionNotes']
    const rows = [header]
    for (const s of exportSessions){
      for (const e of s.entries){
        e.sets.forEach((set, idx) => {
          const e1 = computeE1RM({ weight: set.weight, reps: set.reps, formula: db.settings.e1rmFormula })
          rows.push([
            formatDate(s.dateIso),
            s.dayType || '',
            e.exerciseName,
            String(idx+1),
            set.weight ?? '',
            set.reps ?? '',
            set.rpe ?? '',
            e1 ? Math.round(e1) : '',
            s.notes || ''
          ])
        })
      }
    }
    downloadBlob({
      content: toCSV(rows),
      mime: 'text/csv',
      filename: `workouts-${exportStart}-to-${exportEnd}.csv`
    })
  }

  return (
    <div className="vstack">
      <div className="row">
        <div className="card">
          <div className="muted">Workouts (last 7 days)</div>
          <div style={{fontSize:28, fontWeight:800}}>{last7.length}</div>
        </div>
        <div className="card">
          <div className="muted">Volume (last 7 days)</div>
          <div style={{fontSize:28, fontWeight:800}}>{Math.round(last7Volume).toLocaleString()}</div>
          <div className="muted" style={{fontSize:12}}>{db.settings.units}·reps</div>
        </div>
      </div>

      <div className="card vstack">
        <div className="hstack" style={{justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:700}}>PRs (best estimated 1RM)</div>
            <div className="muted" style={{fontSize:12}}>Formula: {db.settings.e1rmFormula === 'brzycki' ? 'Brzycki' : 'Epley'}</div>
          </div>
          <div style={{minWidth:220}}>
            <label>Trend exercise</label>
            <select value={selectedExerciseId} onChange={e=>setSelectedExerciseId(e.target.value)}>
              <option value="">Select…</option>
              {prs.map(p=> <option key={p.exerciseId} value={p.exerciseId}>{p.exerciseName}</option>) }
            </select>
          </div>
        </div>

        {prs.length === 0 ? (
          <div className="muted">No workouts yet. Log your first session to start tracking PRs.</div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>Best e1RM</th>
                  <th>Set</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {prs.slice(0,8).map(p=> (
                  <tr key={p.exerciseId}>
                    <td>{p.exerciseName}</td>
                    <td>{Math.round(p.e1rm)}</td>
                    <td>{p.weight} × {p.reps}</td>
                    <td>{formatDate(p.dateIso)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedExerciseId && (
          <div className="card" style={{background:'rgba(2,6,23,0.25)'}}>
            <div style={{fontWeight:700, marginBottom:8}}>e1RM trend</div>
            {trend.length === 0 ? (
              <div className="muted">No data yet for that exercise.</div>
            ) : (
              <div className="vstack" style={{gap:8}}>
                {trend.slice(-10).map((pt, idx)=> (
                  <div key={idx} className="hstack" style={{justifyContent:'space-between'}}>
                    <div className="muted">{pt.date}</div>
                    <div style={{fontWeight:700}}>{Math.round(pt.e1rm)}</div>
                  </div>
                ))}
                <div className="muted" style={{fontSize:12}}>Showing last 10 logged sessions for the selected exercise.</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card vstack">
        <div className="hstack" style={{justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:700}}>Export workouts</div>
            <div className="muted" style={{fontSize:12}}>Export a date range for logging & analysis.</div>
          </div>
          <div className="muted" style={{fontSize:12}}>{exportSessions.length} sessions</div>
        </div>

        <div className="row">
          <div>
            <label>Start</label>
            <input type="date" value={exportStart} onChange={e=>setExportStart(e.target.value)} />
          </div>
          <div>
            <label>End</label>
            <input type="date" value={exportEnd} onChange={e=>setExportEnd(e.target.value)} />
          </div>
        </div>

        <div className="hstack" style={{flexWrap:'wrap'}}>
          <button className="primary" onClick={exportRangeJSON} disabled={exportSessions.length===0}>Export JSON</button>
          <button onClick={exportRangeCSV} disabled={exportSessions.length===0}>Export CSV</button>
        </div>
      </div>

      <div className="card vstack">
        <div style={{fontWeight:700}}>Recent sessions</div>
        {sessions.length === 0 ? (
          <div className="muted">None yet.</div>
        ) : (
          <div className="vstack" style={{gap:8}}>
            {sessions.slice(0,5).map(s => (
              <div key={s.id} className="hstack" style={{justifyContent:'space-between'}}>
                <div>
                  <div style={{fontWeight:700}}>{formatDate(s.dateIso)}</div>
                  <div className="muted" style={{fontSize:12}}>{s.entries.length} exercises</div>
                </div>
                <div className="pill">{Math.round(s.totalVolume||0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
