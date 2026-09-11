import { DAY_TEMPLATES } from '../storage/templates.js'

export function uid(){
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'id_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16)
}

// YYYY-MM-DD in local time
export function formatDate(iso){
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

export function todayInput(){
  return formatDate(new Date().toISOString())
}

// Workout dates are stored at local noon so they never drift across midnight
export function dateInputToIso(d){
  return new Date(d + 'T12:00:00').toISOString()
}

export function friendlyDate(iso){
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function shortDate(iso){
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatNumber(n){
  return Math.round(Number(n) || 0).toLocaleString()
}

export function plural(n, word){
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// A set counts once it has reps; weight can be blank for bodyweight moves
export function isFilledSet(s){
  return (Number(s.reps) || 0) > 0
}

export function formatSet(s){
  const w = Number(s.weight) || 0
  return w > 0 ? `${w} × ${s.reps}` : `${s.reps} reps`
}

export function sessionVolume(entries){
  let total = 0
  for (const e of entries){
    for (const s of e.sets) total += (Number(s.weight) || 0) * (Number(s.reps) || 0)
  }
  return total
}

export function setCount(session){
  return session.entries.reduce((n, e) => n + e.sets.length, 0)
}

// Active profile's sessions, newest first
export function profileSessions(db){
  return db.sessions
    .filter(s => s.profileId === db.activeProfileId)
    .slice()
    .sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1))
}

// exerciseId -> { dateIso, sets } from the most recent session that included it
export function lastTimeByExercise(sessions){
  const map = new Map()
  for (const s of sessions){
    for (const en of s.entries || []){
      if (!en?.exerciseId || map.has(en.exerciseId)) continue
      map.set(en.exerciseId, { dateIso: s.dateIso, sets: (en.sets || []).filter(isFilledSet) })
    }
  }
  return map
}

// Heaviest set, ties broken by reps
export function bestSet(sets){
  let best = null
  for (const s of sets){
    if (!isFilledSet(s)) continue
    const weight = Number(s.weight) || 0
    const reps = Number(s.reps) || 0
    if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) best = { weight, reps }
  }
  return best
}

// 'Day 1 – Push' -> { eyebrow: 'Day 1', name: 'Push' }
export function splitTemplateLabel(label){
  const [eyebrow, ...rest] = label.split(' – ')
  return rest.length ? { eyebrow, name: rest.join(' – ') } : { eyebrow: '', name: label }
}

export function templateSetCount(template){
  return template.items.reduce((n, i) => n + i.sets, 0)
}

// The routine day after the one you did most recently
export function suggestNextTemplate(sessions){
  for (const s of sessions){
    const idx = DAY_TEMPLATES.findIndex(t => t.label === s.dayType)
    if (idx !== -1) return DAY_TEMPLATES[(idx + 1) % DAY_TEMPLATES.length]
  }
  return DAY_TEMPLATES[0]
}

export function lastDoneByTemplate(sessions){
  const map = new Map()
  for (const s of sessions){
    if (s.dayType && !map.has(s.dayType)) map.set(s.dayType, s.dateIso)
  }
  return map
}

export function draftProgress(draft){
  let done = 0
  let total = 0
  for (const en of draft.entries){
    total += en.sets.length
    done += en.sets.filter(isFilledSet).length
  }
  return { done, total }
}

export function downloadFile({ content, mime, filename }){
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // iOS needs the URL to outlive the click
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
