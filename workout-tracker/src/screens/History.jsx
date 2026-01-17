import React, { useMemo, useState } from 'react'
import { formatDate } from '../storage/db.js'

function withinLastNDays(dateIso, days){
  const d = new Date(dateIso)
  const cutoff = new Date()
  cutoff.setHours(0,0,0,0)
  cutoff.setDate(cutoff.getDate() - (days - 1)) // inclusive window
  return d >= cutoff
}

function formatSets(sets, units){
  return sets
    .filter(s => (Number(s.weight)||0) > 0 && (Number(s.reps)||0) > 0)
    .map(s => `${s.weight}${units ? units : ''}×${s.reps}`)
    .join(', ')
}

export default function History({ db, api }){
  const activeProfileId = db.activeProfileId
  const [selectedId, setSelectedId] = useState(null)

  const sessions = useMemo(()=>{
    return db.sessions
      .filter(s => s.profileId === activeProfileId)
      .filter(s => withinLastNDays(s.dateIso, 14))
      .slice()
      .sort((a,b)=> (a.dateIso < b.dateIso ? 1 : -1))
  }, [db.sessions, activeProfileId])

  const selected = useMemo(()=> sessions.find(s=>s.id === selectedId) || null, [sessions, selectedId])

  function deleteSession(id){
    if (!confirm('Delete this session?')) return
    api.deleteSession(id)
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="vstack">
      <div className="card vstack">
        <div className="hstack" style={{justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:800}}>Workout history</div>
            <div className="muted" style={{fontSize:12}}>Showing the last 14 days on this device.</div>
          </div>
          <div className="muted" style={{fontSize:12}}>{sessions.length} sessions</div>
        </div>

        {sessions.length === 0 ? (
          <div className="muted">No sessions in the last 14 days yet.</div>
        ) : (
          <div className="vstack" style={{gap:10}}>
            {sessions.map(s => (
              <div key={s.id} className="hstack" style={{justifyContent:'space-between', alignItems:'center'}}>
                <button
                  className={selectedId === s.id ? 'active' : ''}
                  onClick={()=>setSelectedId(selectedId === s.id ? null : s.id)}
                  style={{textAlign:'left', flex:1}}
                >
                  <div style={{fontWeight:700}}>{formatDate(s.dateIso)}{s.dayType ? ` • ${s.dayType}` : ''}</div>
                  <div className="muted" style={{fontSize:12}}>{s.entries.length} exercises • {Math.round(s.totalVolume||0).toLocaleString()} vol</div>
                </button>
                <button className="danger" onClick={()=>deleteSession(s.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="card vstack">
          <div className="hstack" style={{justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:800}}>{formatDate(selected.dateIso)}{selected.dayType ? ` • ${selected.dayType}` : ''}</div>
              <div className="muted" style={{fontSize:12}}>{selected.entries.length} exercises • {Math.round(selected.totalVolume||0).toLocaleString()} volume</div>
            </div>
            <button onClick={()=>setSelectedId(null)}>Close</button>
          </div>

          {selected.notes ? (
            <div className="card" style={{background:'rgba(2,6,23,0.25)'}}>
              <div style={{fontWeight:700, marginBottom:6}}>Notes</div>
              <div className="muted" style={{whiteSpace:'pre-wrap'}}>{selected.notes}</div>
            </div>
          ) : null}

          <div className="vstack" style={{gap:12}}>
            {selected.entries.map(en => (
              <div key={en.exerciseId} className="card" style={{background:'rgba(2,6,23,0.25)'}}>
                <div style={{fontWeight:800, marginBottom:8}}>{en.exerciseName}</div>
                <div className="muted" style={{fontSize:13}}>
                  {formatSets(en.sets || [], '') || 'No logged sets.'}
                </div>
                <div style={{overflowX:'auto', marginTop:8}}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{width:60}}>Set</th>
                        <th>Weight ({db.settings.units})</th>
                        <th>Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(en.sets||[]).map((s, idx) => (
                        <tr key={idx}>
                          <td>{idx+1}</td>
                          <td>{s.weight}</td>
                          <td>{s.reps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
