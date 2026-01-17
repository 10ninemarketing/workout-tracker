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
    exportJSON(){
      return JSON.stringify(db, null, 2)
    },
    importJSON(raw){
      const parsed = JSON.parse(raw)
      // light guard; if it explodes, caller handles
      setDb(parsed)
    }
  }), [db])

  return { db, api }
}
