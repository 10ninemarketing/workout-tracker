const KEY = 'wt_v1'

function nowIso(){
  return new Date().toISOString()
}

function uid(){
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'id_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16)
}

export function loadDB(){
  try{
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedDB()
    const parsed = JSON.parse(raw)
    // minimal schema guard
    if (!parsed || typeof parsed !== 'object') return seedDB()
    if (!Array.isArray(parsed.profiles)) parsed.profiles = []
    if (!Array.isArray(parsed.exercises)) parsed.exercises = []
    if (!Array.isArray(parsed.sessions)) parsed.sessions = []
    if (!parsed.settings) parsed.settings = { units: 'lb' }
    if (!parsed.activeProfileId) parsed.activeProfileId = parsed.profiles[0]?.id || null
    return parsed
  }catch{
    return seedDB()
  }
}

export function saveDB(db){
  localStorage.setItem(KEY, JSON.stringify(db))
}

export function seedDB(){
  const john = {
    id: uid(),
    name: 'John',
    createdAt: nowIso()
  }

  const demoExercises = [
    { id: uid(), name: 'Bench Press', category: 'Push', equipment: 'Barbell', isActive: true, createdAt: nowIso() },
    { id: uid(), name: 'Lat Pulldown', category: 'Pull', equipment: 'Machine', isActive: true, createdAt: nowIso() },
    { id: uid(), name: 'Back Squat', category: 'Legs', equipment: 'Barbell', isActive: true, createdAt: nowIso() }
  ]

  const db = {
    version: 1,
    settings: { units: 'lb', e1rmFormula: 'epley' },
    profiles: [john],
    activeProfileId: john.id,
    exercises: demoExercises,
    sessions: []
  }
  saveDB(db)
  return db
}

export function computeE1RM({ weight, reps, formula }){
  const w = Number(weight) || 0
  const r = Number(reps) || 0
  if (w <= 0 || r <= 0) return 0

  if (formula === 'brzycki'){
    // Brzycki: 1RM = w * 36 / (37 - r)
    if (r >= 37) return 0
    return w * 36 / (37 - r)
  }

  // Epley: 1RM = w * (1 + r/30)
  return w * (1 + r/30)
}

export function formatDate(iso){
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

export function startOfWeekISO(date = new Date()){
  const d = new Date(date)
  const day = d.getDay() // 0 Sun
  const diff = (day === 0 ? -6 : 1 - day) // Monday start
  d.setDate(d.getDate() + diff)
  d.setHours(0,0,0,0)
  return d.toISOString()
}

export function sum(arr){
  return arr.reduce((a,b)=>a+(Number(b)||0),0)
}
