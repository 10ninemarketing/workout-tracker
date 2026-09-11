import { uid } from '../lib/workout.js'

const KEY = 'wt_v1'

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
    { name: 'Chest Supported Row', category: 'Pull', equipment: 'Machine' },
    { name: 'Incline DB Curls', category: 'Biceps', equipment: 'Dumbbell' },
    { name: 'Hammer Curls', category: 'Biceps', equipment: 'Dumbbell' },

    // Day 3 – Legs
    { name: 'Leg Press', category: 'Legs', equipment: 'Machine' },
    { name: 'Goblet Squats', category: 'Legs', equipment: 'Dumbbell' },
    { name: 'Split Squats', category: 'Legs', equipment: 'Dumbbell' },
    { name: 'Leg Extensions', category: 'Legs', equipment: 'Machine' },
    { name: 'Hamstring Curls', category: 'Legs', equipment: 'Machine' },

    // Day 4 – Push (light)
    { name: 'Machine Chest Press', category: 'Push', equipment: 'Machine' },
    { name: 'Decline DB Bench (neutral grip)', category: 'Push', equipment: 'Dumbbell' },
    { name: 'Cable Y-Raise', category: 'Shoulders', equipment: 'Cable' },
    { name: 'Lateral Raises (slow)', category: 'Shoulders', equipment: 'Dumbbell' },
    { name: 'Skull Crushers (light)', category: 'Triceps', equipment: 'EZ Bar' },
    { name: 'Rope Pushdowns', category: 'Triceps', equipment: 'Cable' },

    // Day 5 – Pull
    { name: 'Pull-Ups (assisted if needed)', category: 'Pull', equipment: 'Bodyweight' },
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
    version: 1,
    settings: { units: 'lb' },
    profiles: [john],
    activeProfileId: john.id,
    exercises,
    sessions: []
  }
  saveDB(db)
  return db
}
