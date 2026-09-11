import React, { useMemo, useState } from 'react'
import { Icon } from '../components/Icons.jsx'
import { uid, formatDate, todayInput, downloadFile, setCount, plural } from '../lib/workout.js'

function toCSV(rows){
  const esc = v => {
    const s = (v ?? '').toString()
    return /[\n\r",]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s
  }
  return rows.map(r => r.map(esc).join(',')).join('\n')
}

export default function Settings({ db, api, notify }){
  const profiles = useMemo(() => db.profiles.slice().sort((a, b) => a.name.localeCompare(b.name)), [db.profiles])
  const [newName, setNewName] = useState('')
  const [start, setStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return formatDate(d.toISOString())
  })
  const [end, setEnd] = useState(todayInput())
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [restoreText, setRestoreText] = useState('')

  const rangeSessions = useMemo(() => {
    return db.sessions
      .filter(s => s.profileId === db.activeProfileId)
      .filter(s => {
        const key = formatDate(s.dateIso)
        return key >= start && key <= end
      })
      .sort((a, b) => (a.dateIso < b.dateIso ? -1 : 1))
  }, [db.sessions, db.activeProfileId, start, end])

  function createProfile(e){
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    api.upsertProfile({ id: uid(), name, createdAt: new Date().toISOString() })
    setNewName('')
    notify('Profile added')
  }

  function deleteProfile(p){
    if (!confirm(`Delete profile “${p.name}” and all of its workouts from this phone?`)) return
    api.deleteProfile(p.id)
    notify('Profile deleted')
  }

  function exportCSV(){
    const rows = [['date', 'workout', 'exercise', 'set', `weight (${db.settings.units})`, 'reps', 'notes']]
    for (const s of rangeSessions){
      for (const en of s.entries){
        en.sets.forEach((set, i) => {
          rows.push([formatDate(s.dateIso), s.dayType || '', en.exerciseName, String(i + 1), set.weight ?? '', set.reps ?? '', s.notes || ''])
        })
      }
    }
    downloadFile({ content: toCSV(rows), mime: 'text/csv', filename: `workouts-${start}-to-${end}.csv` })
  }

  function exportJSON(){
    const payload = {
      exportedAt: new Date().toISOString(),
      units: db.settings.units,
      dateRange: { start, end },
      sessions: rangeSessions
    }
    downloadFile({ content: JSON.stringify(payload, null, 2), mime: 'application/json', filename: `workouts-${start}-to-${end}.json` })
  }

  function downloadBackup(){
    downloadFile({
      content: api.exportJSON(),
      mime: 'application/json',
      filename: `workout-tracker-backup-${todayInput()}.json`
    })
  }

  function restore(){
    if (!confirm('Restore from this backup? Everything currently on this phone will be replaced.')) return
    try{
      api.importJSON(restoreText)
      setRestoreText('')
      setRestoreOpen(false)
      notify('Backup restored')
    }catch{
      alert('That doesn’t look like a full backup from this app. Use the file saved by “Save full backup”.')
    }
  }

  const rangeSets = rangeSessions.reduce((n, s) => n + setCount(s), 0)

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <div className="eyebrow">Workout Tracker</div>
          <h1 className="title-lg">Settings</h1>
        </div>
      </header>

      <section>
        <div className="section-label">Profiles</div>
        <div className="list">
          {profiles.map(p => {
            const active = p.id === db.activeProfileId
            return (
              <div key={p.id} className="list-row">
                <button className="row-main row-btn" disabled={active} onClick={() => api.setActiveProfile(p.id)}>
                  <span className="row-title">{p.name}</span>
                  <span className="row-sub">{active ? 'Active' : 'Tap to switch'}</span>
                </button>
                {active && <Icon name="check" size={20} className="accent-text" />}
                <button className="icon-btn" aria-label={`Delete ${p.name}`} onClick={() => deleteProfile(p)}>
                  <Icon name="trash" size={18} />
                </button>
              </div>
            )
          })}
          <form className="list-row" onSubmit={createProfile}>
            <input
              className="input input-bare row-main"
              placeholder="Add a profile"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              aria-label="New profile name"
            />
            <button className="btn-text" disabled={!newName.trim()}>Add</button>
          </form>
        </div>
      </section>

      <section>
        <div className="section-label">Export workouts</div>
        <div className="card vstack">
          <div className="row2">
            <label className="field">
              <span className="field-label">From</span>
              <input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">To</span>
              <input type="date" className="input" value={end} onChange={e => setEnd(e.target.value)} />
            </label>
          </div>
          <div className="muted small">{plural(rangeSessions.length, 'workout')} · {plural(rangeSets, 'set')} in this range</div>
          <div className="row2">
            <button className="btn" onClick={exportCSV} disabled={rangeSessions.length === 0}>
              <Icon name="download" size={18} /> CSV
            </button>
            <button className="btn" onClick={exportJSON} disabled={rangeSessions.length === 0}>
              <Icon name="download" size={18} /> JSON
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="section-label">Backup</div>
        <div className="list">
          <button className="list-row" onClick={downloadBackup}>
            <Icon name="download" />
            <span className="row-main">
              <span className="row-title">Save full backup</span>
              <span className="row-sub">Everything on this phone, as a JSON file</span>
            </span>
          </button>
          <button className="list-row" onClick={() => setRestoreOpen(v => !v)}>
            <Icon name="upload" />
            <span className="row-main">
              <span className="row-title">Restore from backup</span>
              <span className="row-sub">Replaces everything on this phone</span>
            </span>
          </button>
        </div>

        {restoreOpen && (
          <div className="card vstack restore">
            <label className="field">
              <span className="field-label">Paste the contents of a backup file</span>
              <textarea className="input" value={restoreText} onChange={e => setRestoreText(e.target.value)} placeholder="{ …" />
            </label>
            <div className="row2">
              <button className="btn" onClick={() => { setRestoreOpen(false); setRestoreText('') }}>Cancel</button>
              <button className="btn btn-primary" onClick={restore} disabled={!restoreText.trim()}>Restore</button>
            </div>
          </div>
        )}
      </section>

      <p className="footnote">
        Your workouts are stored on this phone only — no account, no syncing. Nothing is ever deleted
        automatically, so save a backup now and then in case you lose or replace this phone.
      </p>
    </div>
  )
}
