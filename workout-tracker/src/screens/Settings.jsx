import React, { useMemo, useState } from 'react'
import { Icon } from '../components/Icons.jsx'
import { uid, formatDate, todayInput, downloadFile, copyText, shareFile, canShareFiles, setCount, plural } from '../lib/workout.js'

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
  const shareable = useMemo(() => canShareFiles(), [])
  const targets = db.settings.targets || {}
  const macroKcal = (Number(targets.protein) || 0) * 4 + (Number(targets.carbs) || 0) * 4 + (Number(targets.fat) || 0) * 9
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

  function buildCSV(){
    const rows = [['date', 'workout', 'exercise', 'set', `weight (${db.settings.units})`, 'reps', 'notes']]
    for (const s of rangeSessions){
      for (const en of s.entries){
        en.sets.forEach((set, i) => {
          rows.push([formatDate(s.dateIso), s.dayType || '', en.exerciseName, String(i + 1), set.weight ?? '', set.reps ?? '', s.notes || ''])
        })
      }
    }
    return toCSV(rows)
  }

  function buildJSON(){
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      units: db.settings.units,
      dateRange: { start, end },
      sessions: rangeSessions
    }, null, 2)
  }

  const rangeFood = useMemo(() => {
    return db.foodLog
      .filter(e => e.profileId === db.activeProfileId)
      .filter(e => e.date >= start && e.date <= end)
      .slice()
      .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? -1 : 1) : (a.date < b.date ? -1 : 1)))
  }, [db.foodLog, db.activeProfileId, start, end])

  const rangeWeights = useMemo(() => {
    return db.weights
      .filter(w => w.profileId === db.activeProfileId)
      .filter(w => w.date >= start && w.date <= end)
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
  }, [db.weights, db.activeProfileId, start, end])

  // One file with both tables: intake needs the scale beside it to mean anything.
  function buildFoodCSV(){
    const rows = [['date', 'food', 'brand', 'serving', 'servings', 'kcal', 'protein', 'carbs', 'fat', 'sat fat', 'fiber', 'soluble fiber']]
    for (const e of rangeFood){
      const q = Number(e.servings) || 0
      const r = v => Math.round((Number(v) || 0) * q * 10) / 10
      rows.push([e.date, e.foodName, e.brand || '', e.serving || '', String(q), String(r(e.kcal)), String(r(e.protein)), String(r(e.carbs)), String(r(e.fat)), String(r(e.satFat)), String(r(e.fiber)), String(r(e.soluble))])
    }
    rows.push([])
    rows.push(['date', 'bodyweight (lb)'])
    for (const w of rangeWeights) rows.push([w.date, String(w.lbs ?? '')])
    return toCSV(rows)
  }

  const foodCsvName = `food-${start}-to-${end}.csv`

  function exportFoodCSV(){
    downloadFile({ content: buildFoodCSV(), mime: 'text/csv', filename: foodCsvName })
  }

  async function copyFoodCSV(){
    const ok = await copyText(buildFoodCSV())
    notify(ok ? 'Food log copied' : 'Could not copy')
  }

  async function shareFoodCSV(){
    const ok = await shareFile({ content: buildFoodCSV(), mime: 'text/csv', filename: foodCsvName })
    if (!ok) exportFoodCSV()
  }

  const csvName = `workouts-${start}-to-${end}.csv`

  function exportCSV(){
    downloadFile({ content: buildCSV(), mime: 'text/csv', filename: csvName })
  }

  function exportJSON(){
    downloadFile({ content: buildJSON(), mime: 'application/json', filename: `workouts-${start}-to-${end}.json` })
  }

  async function copyCSV(){
    const ok = await copyText(buildCSV())
    notify(ok ? 'CSV copied — paste it anywhere' : 'Could not copy — use CSV instead')
  }

  async function shareCSV(){
    const ok = await shareFile({ content: buildCSV(), mime: 'text/csv', filename: csvName })
    if (!ok) exportCSV()
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
        <div className="section-label">Daily targets</div>
        <div className="card vstack">
          <div className="row2">
            <label className="field">
              <span className="field-label">Calories</span>
              <input
                type="number" inputMode="numeric" min="0" className="input num"
                value={targets.kcal ?? ''}
                onChange={e => api.updateTargets({ kcal: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="field">
              <span className="field-label">Protein (g)</span>
              <input
                type="number" inputMode="numeric" min="0" className="input num"
                value={targets.protein ?? ''}
                onChange={e => api.updateTargets({ protein: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
          <div className="row2">
            <label className="field">
              <span className="field-label">Carbs (g)</span>
              <input
                type="number" inputMode="numeric" min="0" className="input num"
                value={targets.carbs ?? ''}
                onChange={e => api.updateTargets({ carbs: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="field">
              <span className="field-label">Fat (g)</span>
              <input
                type="number" inputMode="numeric" min="0" className="input num"
                value={targets.fat ?? ''}
                onChange={e => api.updateTargets({ fat: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
          <div className="row2">
            <label className="field">
              <span className="field-label">Fiber (g)</span>
              <input
                type="number" inputMode="numeric" min="0" className="input num"
                value={targets.fiber ?? ''}
                onChange={e => api.updateTargets({ fiber: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="field">
              <span className="field-label">Soluble fiber (g)</span>
              <input
                type="number" inputMode="numeric" min="0" className="input num"
                value={targets.soluble ?? ''}
                onChange={e => api.updateTargets({ soluble: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
          <label className="field">
            <span className="field-label">Saturated fat limit (g)</span>
            <input
              type="number" inputMode="numeric" min="0" className="input num"
              value={targets.satFat ?? ''}
              onChange={e => api.updateTargets({ satFat: Number(e.target.value) || 0 })}
            />
          </label>
          <div className="muted small">
            These macros add up to {macroKcal.toLocaleString()} kcal{Math.abs(macroKcal - (Number(targets.kcal) || 0)) > 40 ? `, which is off your calorie target by ${Math.abs(macroKcal - (Number(targets.kcal) || 0)).toLocaleString()}.` : '.'}
          </div>
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
          <div className="row2">
            <button className="btn" onClick={copyCSV} disabled={rangeSessions.length === 0}>
              <Icon name="copy" size={18} /> Copy CSV
            </button>
            {shareable && (
              <button className="btn" onClick={shareCSV} disabled={rangeSessions.length === 0}>
                <Icon name="share" size={18} /> Share
              </button>
            )}
          </div>
          <div className="muted small">
            Copy drops the whole range on your clipboard as text. Share hands the file to AirDrop, Mail or Files.
          </div>
        </div>
      </section>

      <section>
        <div className="section-label">Export food</div>
        <div className="card vstack">
          <div className="muted small">
            {rangeFood.length === 0 ? 'Nothing logged in this range yet.' : `${rangeFood.length} entries and ${rangeWeights.length} weigh-ins, same date range as above`}
          </div>
          <div className="row2">
            <button className="btn" onClick={exportFoodCSV} disabled={rangeFood.length === 0 && rangeWeights.length === 0}>
              <Icon name="download" size={18} /> CSV
            </button>
            <button className="btn" onClick={copyFoodCSV} disabled={rangeFood.length === 0 && rangeWeights.length === 0}>
              <Icon name="copy" size={18} /> Copy CSV
            </button>
          </div>
          {shareable && (
            <button className="btn btn-block" onClick={shareFoodCSV} disabled={rangeFood.length === 0 && rangeWeights.length === 0}>
              <Icon name="share" size={18} /> Share
            </button>
          )}
          <div className="muted small">Intake and the scale in one file, so the two can be read against each other.</div>
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
