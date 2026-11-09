import { useEffect, useMemo, useState } from 'react'
import { loadDB, saveDB } from './db.js'

export function useDB(){
  const [db, setDb] = useState(()=>loadDB())

  useEffect(()=>{
    saveDB(db)
  }, [db])

  const api = useMemo(()=>({
    setDb,
    setActiveProfile(id){
      setDb(d=>({ ...d, activeProfileId: id }))
    },
    upsertProfile(profile){
      setDb(d=>{
        const exists = d.profiles.some(p=>p.id === profile.id)
        const profiles = exists
          ? d.profiles.map(p=>p.id === profile.id ? { ...p, ...profile } : p)
          : [...d.profiles, profile]
        const activeProfileId = d.activeProfileId || profile.id
        return { ...d, profiles, activeProfileId }
      })
    },
    deleteProfile(id){
      setDb(d=>{
        const profiles = d.profiles.filter(p=>p.id !== id)
        const sessions = d.sessions.filter(s=>s.profileId !== id)
        const activeProfileId = (d.activeProfileId === id) ? (profiles[0]?.id || null) : d.activeProfileId
        return { ...d, profiles, sessions, activeProfileId }
      })
    },
    upsertExercise(ex){
      setDb(d=>{
        const exists = d.exercises.some(e=>e.id === ex.id)
        const exercises = exists
          ? d.exercises.map(e=>e.id === ex.id ? { ...e, ...ex } : e)
          : [...d.exercises, ex]
        return { ...d, exercises }
      })
    },
    deleteExercise(id){
      // hard delete exercises; sessions keep name snapshot per set, so history remains readable
      setDb(d=>({ ...d, exercises: d.exercises.filter(e=>e.id !== id) }))
    },
    addSession(session){
      // Every workout is kept; nothing is pruned by age.
      setDb(d=>({ ...d, sessions: [...d.sessions, session] }))
    },
    updateSession(session){
      setDb(d=>({ ...d, sessions: d.sessions.map(s=>s.id === session.id ? { ...s, ...session } : s) }))
    },
    deleteSession(id){
      setDb(d=>({ ...d, sessions: d.sessions.filter(s=>s.id !== id) }))
    },
    updateSettings(settings){
      setDb(d=>({ ...d, settings: { ...d.settings, ...settings } }))
    },
    upsertFood(food){
      setDb(d=>{
        const exists = d.foods.some(f=>f.id === food.id)
        const foods = exists
          ? d.foods.map(f=>f.id === food.id ? { ...f, ...food } : f)
          : [...d.foods, food]
        return { ...d, foods }
      })
    },
    deleteFood(id){
      // The log keeps its own macro snapshot per row, so deleting a food
      // leaves every day you already ate it intact.
      setDb(d=>({ ...d, foods: d.foods.filter(f=>f.id !== id) }))
    },
    addFoodLog(entry){
      setDb(d=>({ ...d, foodLog: [...d.foodLog, entry] }))
    },
    updateFoodLog(id, patch){
      setDb(d=>({ ...d, foodLog: d.foodLog.map(e=>e.id === id ? { ...e, ...patch } : e) }))
    },
    deleteFoodLog(id){
      setDb(d=>({ ...d, foodLog: d.foodLog.filter(e=>e.id !== id) }))
    },
    setWeight({ profileId, date, lbs, id }){
      setDb(d=>{
        const existing = d.weights.find(w=>w.profileId === profileId && w.date === date)
        if (lbs === '' || lbs == null){
          return { ...d, weights: d.weights.filter(w=>!(w.profileId === profileId && w.date === date)) }
        }
        const weights = existing
          ? d.weights.map(w=>w === existing ? { ...w, lbs } : w)
          : [...d.weights, { id, profileId, date, lbs, createdAt: new Date().toISOString() }]
        return { ...d, weights }
      })
    },
    updateTargets(targets){
      setDb(d=>({ ...d, settings: { ...d.settings, targets: { ...d.settings.targets, ...targets } } }))
    },
    exportJSON(){
      return JSON.stringify(db, null, 2)
    },
    importJSON(raw){
      const parsed = JSON.parse(raw)
      // Only accept a full backup; anything else would wipe the library
      if (!parsed || !Array.isArray(parsed.profiles) || !Array.isArray(parsed.exercises) || !Array.isArray(parsed.sessions)){
        throw new Error('Not a full backup')
      }
      // Backups taken before food logging existed have no food arrays
      if (!Array.isArray(parsed.foods)) parsed.foods = []
      if (!Array.isArray(parsed.foodLog)) parsed.foodLog = []
      if (!Array.isArray(parsed.weights)) parsed.weights = []
      setDb(parsed)
    }
  }), [db])

  return { db, api }
}
