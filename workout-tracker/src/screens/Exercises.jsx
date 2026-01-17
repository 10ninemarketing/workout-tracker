import React, { useMemo, useState } from 'react'

function uid(){
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'id_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16)
}

const CATEGORIES = ['Push','Pull','Legs','Shoulders','Arms','Core','Cardio','Other']
const EQUIPMENT = ['Barbell','Dumbbell','Machine','Cable','Bodyweight','Kettlebell','Other']

export default function Exercises({ db, api }){
  const exercises = useMemo(()=> db.exercises.slice().sort((a,b)=>a.name.localeCompare(b.name)), [db.exercises])
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(()=>{
    if (filter === 'active') return exercises.filter(e=>e.isActive !== false)
    if (filter === 'inactive') return exercises.filter(e=>e.isActive === false)
    return exercises
  }, [exercises, filter])

  function startAdd(){
    setEditing({
      id: uid(),
      name: '',
      category: 'Other',
      equipment: 'Other',
      isActive: true,
      createdAt: new Date().toISOString()
    })
  }

  function startEdit(ex){
    setEditing({ ...ex })
  }

  function save(){
    if (!editing.name.trim()) return alert('Name is required')
    api.upsertExercise({ ...editing, name: editing.name.trim() })
    setEditing(null)
  }

  function remove(ex){
    const msg = `Delete "${ex.name}" from your exercise library?\n\nThis does not delete past sessions, but future logging won\'t have this exercise.`
    if (!confirm(msg)) return
    api.deleteExercise(ex.id)
  }

  return (
    <div className="vstack">
      <div className="card vstack">
        <div className="hstack" style={{justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:800}}>Exercise library</div>
            <div className="muted" style={{fontSize:12}}>Add/edit exercises anytime.</div>
          </div>
          <button className="primary" onClick={startAdd}>+ Add exercise</button>
        </div>

        <div className="row">
          <div>
            <label>Filter</label>
            <select value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label>Total</label>
            <input value={filtered.length} readOnly />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="muted">No exercises found.</div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Equipment</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ex => (
                  <tr key={ex.id}>
                    <td style={{fontWeight:700}}>{ex.name}</td>
                    <td>{ex.category || '—'}</td>
                    <td>{ex.equipment || '—'}</td>
                    <td>
                      {ex.isActive === false ? <span className="pill">Inactive</span> : <span className="pill" style={{borderColor:'rgba(74,222,128,0.4)', color:'var(--good)'}}>Active</span>}
                    </td>
                    <td>
                      <div className="hstack" style={{justifyContent:'end'}}>
                        <button onClick={()=>startEdit(ex)}>Edit</button>
                        <button className="danger" onClick={()=>remove(ex)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="card vstack">
          <div className="hstack" style={{justifyContent:'space-between'}}>
            <div style={{fontWeight:800}}>{db.exercises.some(e=>e.id===editing.id) ? 'Edit exercise' : 'Add exercise'}</div>
            <button onClick={()=>setEditing(null)}>Close</button>
          </div>

          <div className="row">
            <div>
              <label>Name</label>
              <input value={editing.name} onChange={e=>setEditing(v=>({ ...v, name: e.target.value }))} placeholder="e.g., Incline DB Press" />
            </div>
            <div>
              <label>Status</label>
              <select value={editing.isActive === false ? 'inactive' : 'active'} onChange={e=>setEditing(v=>({ ...v, isActive: e.target.value === 'active' }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div>
              <label>Category</label>
              <select value={editing.category || 'Other'} onChange={e=>setEditing(v=>({ ...v, category: e.target.value }))}>
                {CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Equipment</label>
              <select value={editing.equipment || 'Other'} onChange={e=>setEditing(v=>({ ...v, equipment: e.target.value }))}>
                {EQUIPMENT.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="hstack" style={{justifyContent:'end'}}>
            <button onClick={()=>setEditing(null)}>Cancel</button>
            <button className="primary" onClick={save}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
