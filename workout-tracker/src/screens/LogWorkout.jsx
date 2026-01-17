import React, { useMemo, useState } from 'react'
import { computeE1RM, formatDate } from '../storage/db.js'

function uid(){
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'id_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16)
}

function todayIso(){
  const d = new Date()
  d.setHours(12,0,0,0)
  return d.toISOString()
}

function computeTotalVolume(entries){
  let total = 0
  for (const e of entries){
    for (const s of e.sets){
      total += (Number(s.weight)||0) * (Number(s.reps)||0)
    }
  }
  return total
}

export default function LogWorkout({ db, api }){
  const activeProfileId = db.activeProfileId

  const activeExercises = useMemo(()=> db.exercises.filter(e=>e.isActive !== false).sort((a,b)=>a.name.localeCompare(b.name)), [db.exercises])

  const [date, setDate] = useState(formatDate(todayIso()))
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState([])
  const [exercisePick, setExercisePick] = useState(activeExercises[0]?.id || '')

  const sessions = useMemo(()=>{
    return db.sessions
      .filter(s=>s.profileId === activeProfileId)
      .slice()
      .sort((a,b)=> (a.dateIso < b.dateIso ? 1 : -1))
  }, [db.sessions, activeProfileId])

  function addExerciseEntry(){
    const ex = activeExercises.find(e=>e.id === exercisePick)
    if (!ex) return
    // avoid duplicates in same session
    if (entries.some(en=>en.exerciseId === ex.id)) return
    setEntries(prev => [...prev, {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: [ { weight: '', reps: '', rpe: '' } ]
    }])
  }

  function addSet(exId){
    setEntries(prev => prev.map(en => en.exerciseId === exId
      ? { ...en, sets: [...en.sets, { weight: '', reps: '', rpe: '' }] }
      : en
    ))
  }

  function updateSet(exId, idx, field, value){
    setEntries(prev => prev.map(en => {
      if (en.exerciseId !== exId) return en
      const sets = en.sets.map((s,i)=> i===idx ? { ...s, [field]: value } : s)
      return { ...en, sets }
    }))
  }

  function removeSet(exId, idx){
    setEntries(prev => prev.map(en => {
      if (en.exerciseId !== exId) return en
      const sets = en.sets.filter((_,i)=>i!==idx)
      return { ...en, sets: sets.length ? sets : [{ weight:'', reps:'', rpe:'' }] }
    }))
  }

  function removeExerciseEntry(exId){
    setEntries(prev => prev.filter(en => en.exerciseId !== exId))
  }

  function saveSession(){
    const dateIso = new Date(date + 'T12:00:00').toISOString()
    const cleanedEntries = entries
      .map(en => ({
        ...en,
        sets: en.sets
          .map(s => ({
            weight: s.weight === '' ? '' : Number(s.weight),
            reps: s.reps === '' ? '' : Number(s.reps),
            rpe: s.rpe === '' ? '' : Number(s.rpe)
          }))
          .filter(s => (Number(s.weight)||0) > 0 && (Number(s.reps)||0) > 0)
      }))
      .filter(en => en.sets.length > 0)

    if (cleanedEntries.length === 0){
      alert('Add at least one set with weight and reps.')
      return
    }

    const session = {
      id: uid(),
      profileId: activeProfileId,
      dateIso,
      notes,
      entries: cleanedEntries,
      totalVolume: computeTotalVolume(cleanedEntries),
      createdAt: new Date().toISOString()
    }

    api.addSession(session)
    setNotes('')
    setEntries([])
  }

  function deleteSession(id){
    if (!confirm('Delete this session?')) return
    api.deleteSession(id)
  }

  return (
    <div className="vstack">
      <div className="card vstack">
        <div className="hstack" style={{justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:800}}>Log workout</div>
            <div className="muted" style={{fontSize:12}}>Straight sets • {db.settings.units.toUpperCase()}</div>
          </div>
          <div style={{minWidth:160}}>
            <label>Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
        </div>

        <div className="row">
          <div>
            <label>Add exercise</label>
            <select value={exercisePick} onChange={e=>setExercisePick(e.target.value)}>
              {activeExercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
          <div style={{display:'flex', alignItems:'end'}}>
            <button className="primary" onClick={addExerciseEntry}>Add</button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="muted">Add an exercise to start logging sets.</div>
        ) : (
          <div className="vstack">
            {entries.map(en => (
              <div key={en.exerciseId} className="card" style={{background:'rgba(2,6,23,0.25)'}}>
                <div className="hstack" style={{justifyContent:'space-between', marginBottom:8}}>
                  <div style={{fontWeight:800}}>{en.exerciseName}</div>
                  <div className="hstack">
                    <button onClick={()=>addSet(en.exerciseId)}>+ Set</button>
                    <button className="danger" onClick={()=>removeExerciseEntry(en.exerciseId)}>Remove</button>
                  </div>
                </div>

                <div style={{overflowX:'auto'}}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{width:60}}>Set</th>
                        <th>Weight ({db.settings.units})</th>
                        <th>Reps</th>
                        <th>RPE (opt)</th>
                        <th style={{width:90}}>e1RM</th>
                        <th style={{width:60}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {en.sets.map((s, idx) => {
                        const e1 = computeE1RM({ weight: s.weight, reps: s.reps, formula: db.settings.e1rmFormula })
                        return (
                          <tr key={idx}>
                            <td>{idx+1}</td>
                            <td>
                              <input inputMode="decimal" value={s.weight} onChange={e=>updateSet(en.exerciseId, idx, 'weight', e.target.value)} />
                            </td>
                            <td>
                              <input inputMode="numeric" value={s.reps} onChange={e=>updateSet(en.exerciseId, idx, 'reps', e.target.value)} />
                            </td>
                            <td>
                              <input inputMode="decimal" value={s.rpe} onChange={e=>updateSet(en.exerciseId, idx, 'rpe', e.target.value)} />
                            </td>
                            <td>{e1 ? Math.round(e1) : ''}</td>
                            <td>
                              <button className="danger" onClick={()=>removeSet(en.exerciseId, idx)}>✕</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <label>Session notes (optional)</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anything worth noting…" />
        </div>

        <div className="hstack" style={{justifyContent:'space-between'}}>
          <div className="muted" style={{fontSize:12}}>
            Saving will store this session on this phone.
          </div>
          <button className="primary" onClick={saveSession}>Save session</button>
        </div>
      </div>

      <div className="card vstack">
        <div className="hstack" style={{justifyContent:'space-between'}}>
          <div style={{fontWeight:800}}>Recent sessions</div>
          <div className="muted" style={{fontSize:12}}>{sessions.length} total</div>
        </div>

        {sessions.length === 0 ? (
          <div className="muted">None yet.</div>
        ) : (
          <div className="vstack" style={{gap:10}}>
            {sessions.slice(0,10).map(s => (
              <div key={s.id} className="hstack" style={{justifyContent:'space-between'}}>
                <div>
                  <div style={{fontWeight:700}}>{formatDate(s.dateIso)}</div>
                  <div className="muted" style={{fontSize:12}}>{s.entries.length} exercises • {Math.round(s.totalVolume||0).toLocaleString()} vol</div>
                </div>
                <button className="danger" onClick={()=>deleteSession(s.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
