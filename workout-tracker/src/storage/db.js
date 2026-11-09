import { uid } from '../lib/workout.js'

const KEY = 'wt_v1'
const SCHEMA_VERSION = 5

// Exercises that got renamed after the fact. History keeps a name snapshot per
// entry, so a rename has to sweep the sessions too or old workouts keep the old label.
const RENAMES = {
  'Skull Crushers (light)': 'Dips',
  'Pull-Ups (assisted if needed)': 'Pull-Ups (bodyweight)',
}

const ADDED_EXERCISES = [
  { name: 'Assisted Pull-Ups', category: 'Pull', equipment: 'Machine' },
]

// The logged "Chest Supported Row" was always the incline-bench one-arm
// dumbbell row; the name just never said so.
const RENAMES_V4 = {
  'Chest Supported Row': 'Chest-Supported DB Row (1-arm)',
}

// The "Machine Chest Press" was always the Smith. It is the only pressing
// station without a load ceiling, so the name should say what it is.
const RENAMES_V5 = {
  'Machine Chest Press': 'Smith Flat Press',
}

// Gaps the old program never covered: a hinge, calves and loaded carries.
const ADDED_EXERCISES_V3 = [
  { name: 'Romanian Deadlift', category: 'Legs', equipment: 'Barbell' },
  { name: 'Standing Calf Raises', category: 'Legs', equipment: 'Machine' },
  { name: 'Seated Calf Raises', category: 'Legs', equipment: 'Machine' },
  { name: 'Walking Lunges', category: 'Legs', equipment: 'Dumbbell' },
  { name: 'Suitcase Carry', category: 'Core', equipment: 'Dumbbell' },
  { name: 'Plank', category: 'Core', equipment: 'Bodyweight' },
]

function nowIso(){
  return new Date().toISOString()
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
    return migrate(parsed)
  }catch{
    return seedDB()
  }
}

function sessionVolume(session){
  return session.entries.reduce(
    (total, entry) => total + entry.sets.reduce((n, set) => n + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0),
    0
  )
}

// One-way upgrades, each guarded by db.version so they run exactly once per phone.
function migrate(db){
  const from = Number(db.version) || 1
  if (from >= SCHEMA_VERSION) return db

  if (from < 2){
    for (const [oldName, newName] of Object.entries(RENAMES)){
      const stale = db.exercises.find(e => e.name === oldName)
      if (stale){
        const existing = db.exercises.find(e => e.name === newName && e.id !== stale.id)
        if (existing){
          // Both names already in the library — fold the old one into the new one
          db.exercises = db.exercises.filter(e => e.id !== stale.id)
          for (const s of db.sessions){
            for (const en of s.entries){
              if (en.exerciseId === stale.id) en.exerciseId = existing.id
            }
          }
        }else{
          stale.name = newName
        }
      }
      for (const s of db.sessions){
        for (const en of s.entries){
          if (en.exerciseName === oldName) en.exerciseName = newName
        }
      }
    }

    for (const add of ADDED_EXERCISES){
      if (!db.exercises.some(e => e.name === add.name)){
        db.exercises.push({ id: uid(), ...add, isActive: true, createdAt: nowIso() })
      }
    }

    // 2026-09-11 leg press was logged as 260x45; it was 260x15.
    for (const s of db.sessions){
      let touched = false
      for (const en of s.entries){
        if (en.exerciseName !== 'Leg Press') continue
        for (const set of en.sets){
          if (Number(set.weight) === 260 && Number(set.reps) === 45){
            set.reps = 15
            touched = true
          }
        }
      }
      if (touched) s.totalVolume = sessionVolume(s)
    }
  }

  if (from < 3){
    for (const add of ADDED_EXERCISES_V3){
      if (!db.exercises.some(e => e.name === add.name)){
        db.exercises.push({ id: uid(), ...add, isActive: true, createdAt: nowIso() })
      }
    }
  }

  if (from < 4){
    for (const [oldName, newName] of Object.entries(RENAMES_V4)){
      const stale = db.exercises.find(e => e.name === oldName)
      if (stale && !db.exercises.some(e => e.name === newName && e.id !== stale.id)){
        stale.name = newName
        stale.equipment = 'Dumbbell'
      }
      for (const s of db.sessions){
        for (const en of s.entries){
          if (en.exerciseName === oldName) en.exerciseName = newName
        }
      }
    }
  }

  if (from < 5){
    for (const [oldName, newName] of Object.entries(RENAMES_V5)){
      const stale = db.exercises.find(e => e.name === oldName)
      if (stale && !db.exercises.some(e => e.name === newName && e.id !== stale.id)){
        stale.name = newName
        stale.equipment = 'Smith'
      }
      for (const s of db.sessions){
        for (const en of s.entries){
          if (en.exerciseName === oldName) en.exerciseName = newName
        }
      }
    }
  }

  db.version = SCHEMA_VERSION
  saveDB(db)
  return db
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

  // Seed with your current routine exercises (you can edit/add/delete anytime in the app).
  const routineExercises = [
    // Day 1 – Push
    { name: 'Flat DB Bench (neutral grip)', category: 'Push', equipment: 'Dumbbell' },
    { name: 'Incline DB Bench (neutral grip)', category: 'Push', equipment: 'Dumbbell' },
    { name: 'Cable Chest Press (low→mid angle)', category: 'Push', equipment: 'Cable' },
    { name: 'DB Neutral-Grip High-Incline Press (~60°)', category: 'Push', equipment: 'Dumbbell' },
    { name: 'Lateral Raises (strict, light)', category: 'Shoulders', equipment: 'Dumbbell' },
    { name: 'Cable Rope Pushdowns', category: 'Triceps', equipment: 'Cable' },
    { name: 'Overhead Rope Extensions', category: 'Triceps', equipment: 'Cable' },

    // Day 2 – Pull
    { name: 'Lat Pulldown', category: 'Pull', equipment: 'Machine' },
    { name: 'Seated Row (neutral grip)', category: 'Pull', equipment: 'Machine' },
    { name: 'Chest-Supported DB Row (1-arm)', category: 'Pull', equipment: 'Dumbbell' },
    { name: 'Incline DB Curls', category: 'Biceps', equipment: 'Dumbbell' },
    { name: 'Hammer Curls', category: 'Biceps', equipment: 'Dumbbell' },

    // Day 3 – Legs
    { name: 'Leg Press', category: 'Legs', equipment: 'Machine' },
    { name: 'Goblet Squats', category: 'Legs', equipment: 'Dumbbell' },
    { name: 'Split Squats', category: 'Legs', equipment: 'Dumbbell' },
    { name: 'Leg Extensions', category: 'Legs', equipment: 'Machine' },
    { name: 'Hamstring Curls', category: 'Legs', equipment: 'Machine' },
    { name: 'Romanian Deadlift', category: 'Legs', equipment: 'Barbell' },
    { name: 'Standing Calf Raises', category: 'Legs', equipment: 'Machine' },
    { name: 'Seated Calf Raises', category: 'Legs', equipment: 'Machine' },
    { name: 'Walking Lunges', category: 'Legs', equipment: 'Dumbbell' },
    { name: 'Suitcase Carry', category: 'Core', equipment: 'Dumbbell' },
    { name: 'Plank', category: 'Core', equipment: 'Bodyweight' },

    // Day 4 – Push (light)
    { name: 'Smith Flat Press', category: 'Push', equipment: 'Smith' },
    { name: 'Decline DB Bench (neutral grip)', category: 'Push', equipment: 'Dumbbell' },
    { name: 'Cable Y-Raise', category: 'Shoulders', equipment: 'Cable' },
    { name: 'Lateral Raises (slow)', category: 'Shoulders', equipment: 'Dumbbell' },
    { name: 'Dips', category: 'Triceps', equipment: 'Bodyweight' },
    { name: 'Rope Pushdowns', category: 'Triceps', equipment: 'Cable' },

    // Day 5 – Pull
    { name: 'Pull-Ups (bodyweight)', category: 'Pull', equipment: 'Bodyweight' },
    { name: 'Assisted Pull-Ups', category: 'Pull', equipment: 'Machine' },
    { name: 'Machine Row', category: 'Pull', equipment: 'Machine' },
    { name: 'Cable Curls', category: 'Biceps', equipment: 'Cable' },
    { name: 'Reverse Curls', category: 'Biceps', equipment: 'EZ Bar' },

    // Day 6 – Rehab / Chest light
    { name: 'Scapular Plane DB Raise (pain-free)', category: 'Rehab', equipment: 'Dumbbell' },
    { name: 'Face Pulls', category: 'Rehab', equipment: 'Cable' },
    { name: 'Cable External Rotations', category: 'Rehab', equipment: 'Cable' },
    { name: 'Cable Fly (very light)', category: 'Push', equipment: 'Cable' },
  ]

  const exercises = routineExercises.map(e => ({
    id: uid(),
    name: e.name,
    category: e.category,
    equipment: e.equipment,
    isActive: true,
    createdAt: nowIso()
  }))

  const db = {
    version: SCHEMA_VERSION,
    settings: { units: 'lb' },
    profiles: [john],
    activeProfileId: john.id,
    exercises,
    sessions: []
  }
  saveDB(db)
  return db
}
