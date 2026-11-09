// Food logging helpers. Everything here works off per-serving macros times a
// servings multiplier - no unit conversion engine, because the serving label is
// whatever the package says ("1 fillet", "100 g", "2 tbsp") and the macros are
// read straight off the label. Entering the label once is the only typing.

// satFat is a component of fat, not a fifth macro - it renders indented under
// it, and its number is a ceiling rather than something to fill.
export const MACROS = [
  { key: 'kcal', label: 'Calories', unit: '' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'satFat', label: 'Saturated', unit: 'g', sub: true, limit: true },
]

export function num(v){
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// A log row keeps its own macro snapshot, so edit a food tomorrow and
// yesterday's numbers stay as they were eaten.
export function entryMacros(entry){
  const s = num(entry.servings)
  return {
    kcal: num(entry.kcal) * s,
    protein: num(entry.protein) * s,
    carbs: num(entry.carbs) * s,
    fat: num(entry.fat) * s,
    satFat: num(entry.satFat) * s,
  }
}

export function sumMacros(entries){
  return entries.reduce((total, entry) => {
    const m = entryMacros(entry)
    return {
      kcal: total.kcal + m.kcal,
      protein: total.protein + m.protein,
      carbs: total.carbs + m.carbs,
      fat: total.fat + m.fat,
      satFat: total.satFat + m.satFat,
    }
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, satFat: 0 })
}

export function logForDate(db, date){
  return db.foodLog
    .filter(e => e.profileId === db.activeProfileId && e.date === date)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
}

// Foods he actually eats float to the top. Repetitive eating is the whole
// reason this is faster than a database app.
export function foodsByUse(db){
  const counts = new Map()
  for (const e of db.foodLog){
    if (e.profileId !== db.activeProfileId) continue
    counts.set(e.foodId, (counts.get(e.foodId) || 0) + 1)
  }
  return db.foods
    .slice()
    .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0) || a.name.localeCompare(b.name))
    .map(f => ({ ...f, uses: counts.get(f.id) || 0 }))
}

export function weightsFor(db){
  return db.weights
    .filter(w => w.profileId === db.activeProfileId)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
}

// The daily number is water and glycogen. The rolling average is the signal,
// so that is what gets shown large.
export function rollingAverage(weights, days = 7){
  if (weights.length === 0) return null
  const window = weights.slice(-days)
  return window.reduce((n, w) => n + num(w.lbs), 0) / window.length
}

// Average of the last `days` against the `days` before them - a week-over-week
// read that does not care which morning he skipped.
export function weightTrend(weights, days = 7){
  if (weights.length < 2) return null
  const recent = weights.slice(-days)
  const prior = weights.slice(-days * 2, -days)
  if (prior.length === 0) return null
  const avg = list => list.reduce((n, w) => n + num(w.lbs), 0) / list.length
  return avg(recent) - avg(prior)
}

export function round(n, places = 0){
  const f = 10 ** places
  return Math.round(num(n) * f) / f
}

export function fmt(n){
  return round(n).toLocaleString()
}
