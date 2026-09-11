import React, { useEffect, useMemo, useState } from 'react'
import { DAY_TEMPLATES } from '../storage/templates.js'
import Sheet from '../components/Sheet.jsx'
import ExercisePicker from '../components/ExercisePicker.jsx'
import { Icon } from '../components/Icons.jsx'
import {
  uid, todayInput, dateInputToIso, friendlyDate, shortDate, formatSet, isFilledSet,
  sessionVolume, profileSessions, lastTimeByExercise, splitTemplateLabel,
  templateSetCount, suggestNextTemplate, lastDoneByTemplate, draftProgress, plural
} from '../lib/workout.js'

const emptySet = () => ({ weight: '', reps: '' })

export default function LogWorkout(props){
  return props.draft ? <ActiveWorkout {...props} /> : <StartWorkout {...props} />
}

function StartWorkout({ db, startWorkout }){
  const sessions = useMemo(() => profileSessions(db), [db])
  const next = useMemo(() => suggestNextTemplate(sessions), [sessions])
  const lastDone = useMemo(() => lastDoneByTemplate(sessions), [sessions])

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <div className="eyebrow">{friendlyDate(new Date().toISOString())}</div>
          <h1 className="title-lg">Start workout</h1>
        </div>
      </header>

      <TemplateCard template={next} lastDone={lastDone.get(next.label)} featured onStart={startWorkout} />

      <section>
        <div className="section-label">Your routine</div>
        <div className="tpl-grid">
          {DAY_TEMPLATES.filter(t => t.key !== next.key).map(t => (
            <TemplateCard key={t.key} template={t} lastDone={lastDone.get(t.label)} onStart={startWorkout} />
          ))}
        </div>
      </section>

      <button className="btn btn-dashed btn-lg btn-block" onClick={() => startWorkout(null)}>
        <Icon name="plus" size={20} /> Empty workout
      </button>
    </div>
  )
}

function TemplateCard({ template, lastDone, featured, onStart }){
  const { eyebrow, name } = splitTemplateLabel(template.label)
  return (
    <button className={`tpl${featured ? ' tpl-featured' : ''}`} onClick={() => onStart(template)}>
      <span>
        <span className="tpl-eyebrow">{featured ? `Up next · ${eyebrow}` : eyebrow}</span>
        <span className="tpl-name">{name}</span>
      </span>
      <span className="tpl-meta">
        {plural(template.items.length, 'exercise')} · {plural(templateSetCount(template), 'set')}
        <span className="faint">{lastDone ? `Last done ${shortDate(lastDone)}` : 'Not done recently'}</span>
      </span>
      {featured && <span className="tpl-go"><Icon name="play" size={16} /> Start workout</span>}
    </button>
  )
}

function useNow(intervalMs){
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

function ActiveWorkout({ db, api, draft, setDraft, notify }){
  const sessions = useMemo(() => profileSessions(db), [db])
  const lastTime = useMemo(() => lastTimeByExercise(sessions), [sessions])
  const [picker, setPicker] = useState(null) // { mode: 'add' } | { mode: 'swap', key }
  const [menuKey, setMenuKey] = useState(null)
  const now = useNow(30000)

  const entries = draft.entries
  const usedIds = useMemo(() => new Set(entries.map(e => e.exerciseId)), [entries])
  const { done, total } = draftProgress(draft)
  const isToday = draft.date === todayInput()
  const minutes = Math.max(0, Math.floor((now - draft.startedAt) / 60000))

  function update(patch){
    setDraft(d => ({ ...d, ...patch }))
  }

  function updateEntries(fn){
    setDraft(d => ({ ...d, entries: fn(d.entries) }))
  }

  function updateEntry(key, fn){
    updateEntries(list => list.map(en => (en.key === key ? fn(en) : en)))
  }

  function setField(key, idx, field, value){
    updateEntry(key, en => ({ ...en, sets: en.sets.map((s, i) => (i === idx ? { ...s, [field]: value } : s)) }))
  }

  function fillFromPrevious(key, idx, prev){
    const filled = { weight: prev.weight ? String(prev.weight) : '', reps: String(prev.reps) }
    updateEntry(key, en => ({ ...en, sets: en.sets.map((s, i) => (i === idx ? filled : s)) }))
  }

  function addSet(key){
    updateEntry(key, en => ({ ...en, sets: [...en.sets, emptySet()] }))
  }

  function removeSet(key, idx){
    updateEntry(key, en => {
      const sets = en.sets.filter((_, i) => i !== idx)
      return { ...en, sets: sets.length ? sets : [emptySet()] }
    })
  }

  function moveEntry(key, dir){
    updateEntries(list => {
      const i = list.findIndex(e => e.key === key)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return list
      const next = list.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function removeEntry(key){
    const en = entries.find(e => e.key === key)
    if (en?.sets.some(isFilledSet) && !confirm(`Remove ${en.exerciseName} and the sets you logged?`)) return
    updateEntries(list => list.filter(e => e.key !== key))
  }

  function pickExercise(ex){
    if (picker?.mode === 'swap'){
      const en = entries.find(e => e.key === picker.key)
      const logged = en?.sets.filter(isFilledSet).length || 0
      if (logged && !confirm(`Swap ${en.exerciseName} for ${ex.name}? The ${logged} set${logged > 1 ? 's' : ''} you logged will be cleared.`)) return
      updateEntry(picker.key, e => ({ ...e, exerciseId: ex.id, exerciseName: ex.name, sets: e.sets.map(() => emptySet()) }))
    } else {
      const setsLastTime = lastTime.get(ex.id)?.sets.length || 3
      updateEntries(list => [...list, {
        key: uid(),
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: Array.from({ length: setsLastTime }, emptySet)
      }])
    }
    setPicker(null)
  }

  function createExercise(name){
    const swapping = picker?.mode === 'swap' ? entries.find(e => e.key === picker.key) : null
    const category = (swapping && db.exercises.find(e => e.id === swapping.exerciseId)?.category) || 'Other'
    const ex = { id: uid(), name, category, equipment: 'Other', isActive: true, createdAt: new Date().toISOString() }
    api.upsertExercise(ex)
    pickExercise(ex)
  }

  function finish(){
    const cleaned = entries
      .map(en => ({
        exerciseId: en.exerciseId,
        exerciseName: en.exerciseName,
        sets: en.sets.filter(isFilledSet).map(s => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) }))
      }))
      .filter(en => en.sets.length > 0)

    if (cleaned.length === 0){
      alert('Log at least one set before finishing.')
      return
    }
    const skipped = total - done
    const msg = skipped
      ? `Finish workout? ${skipped} empty set${skipped > 1 ? 's' : ''} will be skipped.`
      : 'Finish workout?'
    if (!confirm(msg)) return

    const durationMin = Math.round((Date.now() - draft.startedAt) / 60000)
    api.addSession({
      id: uid(),
      profileId: draft.profileId || db.activeProfileId,
      dateIso: dateInputToIso(draft.date),
      dayType: draft.title,
      notes: draft.notes,
      entries: cleaned,
      totalVolume: sessionVolume(cleaned),
      ...(isToday && durationMin > 0 && durationMin <= 300 ? { durationMin } : {}),
      createdAt: new Date().toISOString()
    })
    setDraft(null)
    notify('Workout saved')
  }

  function discard(){
    if (!confirm('Discard this workout? Nothing will be saved.')) return
    setDraft(null)
  }

  const menuIndex = entries.findIndex(e => e.key === menuKey)
  const menuEntry = entries[menuIndex] || null
  const swapEntry = picker?.mode === 'swap' ? entries.find(e => e.key === picker.key) : null

  return (
    <div className="screen">
      <header className="workout-head">
        <div className="workout-head-main">
          <div className="eyebrow workout-meta">
            <span className="live-dot" aria-hidden="true" />
            {isToday ? `${minutes} min` : friendlyDate(dateInputToIso(draft.date))}
            <span aria-hidden="true">·</span>
            {done}/{total} sets
          </div>
          <h1 className="title-md workout-title">{draft.title || 'Workout'}</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={finish}>Finish</button>
        <div className="workout-progress" style={{ width: total ? `${(done / total) * 100}%` : 0 }} />
      </header>

      {entries.length === 0 && (
        <div className="card empty">
          <div className="empty-title">No exercises yet</div>
          <div className="muted">Add your first exercise to start logging.</div>
        </div>
      )}

      {entries.map(en => (
        <ExerciseCard
          key={en.key}
          entry={en}
          hint={lastTime.get(en.exerciseId)}
          units={db.settings.units}
          onMenu={() => setMenuKey(en.key)}
          onChange={setField}
          onFill={fillFromPrevious}
          onAddSet={addSet}
          onRemoveSet={removeSet}
        />
      ))}

      <button className="btn btn-dashed btn-lg btn-block" onClick={() => setPicker({ mode: 'add' })}>
        <Icon name="plus" size={20} /> Add exercise
      </button>

      <div className="card vstack">
        <label className="field">
          <span className="field-label">Date</span>
          <input type="date" className="input" value={draft.date} onChange={e => e.target.value && update({ date: e.target.value })} />
        </label>
        <label className="field">
          <span className="field-label">Notes</span>
          <textarea className="input" value={draft.notes} onChange={e => update({ notes: e.target.value })} placeholder="How did it feel?" />
        </label>
      </div>

      <button className="btn btn-primary btn-lg btn-block" onClick={finish}>Finish workout</button>
      <button className="btn btn-ghost btn-block danger-text" onClick={discard}>Discard workout</button>

      <Sheet open={!!menuEntry} onClose={() => setMenuKey(null)} title={menuEntry?.exerciseName}>
        <div className="list">
          <button className="list-row" onClick={() => { setMenuKey(null); setPicker({ mode: 'swap', key: menuKey }) }}>
            <Icon name="swap" /><span className="row-main row-title">Swap exercise</span>
          </button>
          <button className="list-row" disabled={menuIndex <= 0} onClick={() => { moveEntry(menuKey, -1); setMenuKey(null) }}>
            <Icon name="arrowUp" /><span className="row-main row-title">Move up</span>
          </button>
          <button className="list-row" disabled={menuIndex >= entries.length - 1} onClick={() => { moveEntry(menuKey, 1); setMenuKey(null) }}>
            <Icon name="arrowDown" /><span className="row-main row-title">Move down</span>
          </button>
          <button className="list-row danger-text" onClick={() => { const k = menuKey; setMenuKey(null); removeEntry(k) }}>
            <Icon name="trash" /><span className="row-main row-title">Remove exercise</span>
          </button>
        </div>
      </Sheet>

      <ExercisePicker
        open={!!picker}
        onClose={() => setPicker(null)}
        title={swapEntry ? `Swap ${swapEntry.exerciseName}` : 'Add exercise'}
        exercises={db.exercises}
        usedIds={usedIds}
        currentId={swapEntry?.exerciseId}
        preferCategory={swapEntry ? db.exercises.find(e => e.id === swapEntry.exerciseId)?.category : null}
        onPick={pickExercise}
        onCreate={createExercise}
      />
    </div>
  )
}

function ExerciseCard({ entry, hint, units, onMenu, onChange, onFill, onAddSet, onRemoveSet }){
  const done = entry.sets.filter(isFilledSet).length
  return (
    <section className="card ex-card">
      <div className="ex-head">
        <div className="row-main">
          <div className="ex-title">{entry.exerciseName}</div>
          <div className="ex-sub">
            {hint ? `Last time ${shortDate(hint.dateIso)}` : 'First time logging this'} · {done}/{entry.sets.length} sets
          </div>
        </div>
        <button className="icon-btn" aria-label={`Options for ${entry.exerciseName}`} onClick={onMenu}>
          <Icon name="more" />
        </button>
      </div>

      <div className="set-grid set-headrow" aria-hidden="true">
        <span>Set</span><span>Previous</span><span>{units}</span><span>Reps</span><span />
      </div>

      {entry.sets.map((s, i) => {
        const prev = hint?.sets[i]
        return (
          <div key={i} className={`set-grid set-row${isFilledSet(s) ? ' is-done' : ''}`}>
            <span className="set-num">{i + 1}</span>
            <button
              type="button"
              className="prev"
              disabled={!prev}
              onClick={() => onFill(entry.key, i, prev)}
              aria-label={prev ? `Use last time: ${formatSet(prev)}` : 'No previous set'}
            >
              {prev ? formatSet(prev) : '—'}
            </button>
            <input
              className="num-input"
              inputMode="decimal"
              aria-label={`Set ${i + 1} weight`}
              value={s.weight}
              onChange={e => onChange(entry.key, i, 'weight', e.target.value)}
            />
            <input
              className="num-input"
              inputMode="numeric"
              aria-label={`Set ${i + 1} reps`}
              value={s.reps}
              onChange={e => onChange(entry.key, i, 'reps', e.target.value)}
            />
            <button type="button" className="icon-btn icon-btn-sm" aria-label={`Remove set ${i + 1}`} onClick={() => onRemoveSet(entry.key, i)}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )
      })}

      <button className="btn btn-soft btn-sm btn-block ex-add" onClick={() => onAddSet(entry.key)}>
        <Icon name="plus" size={16} /> Add set
      </button>
    </section>
  )
}
