import React, { useMemo, useState } from 'react'

function uid(){
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'id_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16)
}

export default function Settings({ db, api, onlyProfileSetup }){
  const profiles = useMemo(()=> db.profiles.slice().sort((a,b)=>a.name.localeCompare(b.name)), [db.profiles])
  const activeProfile = profiles.find(p=>p.id===db.activeProfileId) || null

  const [newName, setNewName] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')

  function createProfile(){
    const name = newName.trim()
    if (!name) return
    api.upsertProfile({ id: uid(), name, createdAt: new Date().toISOString() })
    setNewName('')
  }

  function deleteProfile(p){
    if (!confirm(`Delete profile "${p.name}" and all its sessions from this phone?`)) return
    api.deleteProfile(p.id)
  }

  function downloadExport(){
    const blob = new Blob([api.exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workout-tracker-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function doImport(){
    try{
      api.importJSON(importText)
      setImportText('')
      setImportOpen(false)
      alert('Import complete.')
    }catch{
      alert('Import failed. Make sure you pasted valid JSON exported from this app.')
    }
  }

  return (
    <div className="vstack">
      {!onlyProfileSetup && (
        <div className="card vstack">
          <div style={{fontWeight:800}}>App settings</div>

          <div className="row">
            <div>
              <label>Units</label>
              <input value="lb" readOnly />
              <div className="muted" style={{fontSize:12}}>This build is set to pounds (your preference).</div>
            </div>
            <div>
              <label>Estimated 1RM formula</label>
              <select value={db.settings.e1rmFormula || 'epley'} onChange={e=>api.updateSettings({ e1rmFormula: e.target.value })}>
                <option value="epley">Epley</option>
                <option value="brzycki">Brzycki</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="card vstack">
        <div className="hstack" style={{justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:800}}>Profiles</div>
            <div className="muted" style={{fontSize:12}}>Phone-specific data. No syncing or accounts.</div>
          </div>
        </div>

        <div className="row">
          <div>
            <label>Create profile</label>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g., John" />
          </div>
          <div style={{display:'flex', alignItems:'end'}}>
            <button className="primary" onClick={createProfile}>Create</button>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="muted">No profiles yet.</div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:700}}>{p.name}</td>
                    <td>{p.id === db.activeProfileId ? <span className="pill" style={{borderColor:'rgba(56,189,248,0.4)', color:'var(--accent)'}}>Active</span> : <span className="pill">—</span>}</td>
                    <td>
                      <div className="hstack" style={{justifyContent:'end'}}>
                        <button disabled={p.id===db.activeProfileId} onClick={()=>api.setActiveProfile(p.id)}>Set active</button>
                        <button className="danger" onClick={()=>deleteProfile(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!onlyProfileSetup && (
        <div className="card vstack">
          <div style={{fontWeight:800}}>Backup</div>
          <div className="muted" style={{fontSize:12}}>Export/import is how you migrate to a new phone.</div>

          <div className="hstack" style={{flexWrap:'wrap'}}>
            <button className="primary" onClick={downloadExport}>Export JSON</button>
            <button onClick={()=>setImportOpen(v=>!v)}>{importOpen ? 'Close Import' : 'Import JSON'}</button>
          </div>

          {importOpen && (
            <div className="vstack">
              <label>Paste exported JSON</label>
              <textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder="Paste the full JSON backup here…" />
              <div className="hstack" style={{justifyContent:'end'}}>
                <button onClick={()=>setImportOpen(false)}>Cancel</button>
                <button className="primary" onClick={doImport}>Import</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
