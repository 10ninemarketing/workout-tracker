import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import { Icon } from './components/Icons.jsx'
import Dashboard from './screens/Dashboard.jsx'
import History from './screens/History.jsx'
import LogWorkout from './screens/LogWorkout.jsx'
import Exercises from './screens/Exercises.jsx'
import Settings from './screens/Settings.jsx'
import { useDB } from './storage/useDB.js'
import { useDraft } from './storage/useDraft.js'
import { uid, todayInput } from './lib/workout.js'

export default function App(){
  const { db, api } = useDB()
  const [draft, setDraft] = useDraft()
  // Reopening the app mid-workout lands you back in the workout
  const [tab, setTabState] = useState(() => (draft ? 'log' : 'dashboard'))
  const [toast, setToast] = useState(null)
  const scrollByTab = useRef({})

  const activeProfile = useMemo(
    () => db.profiles.find(p => p.id === db.activeProfileId) || null,
    [db.profiles, db.activeProfileId]
  )

  function setTab(next){
    if (next === tab){
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    scrollByTab.current[tab] = window.scrollY
    setTabState(next)
  }

  // Each tab remembers where you were scrolled
  useLayoutEffect(() => {
    window.scrollTo(0, scrollByTab.current[tab] || 0)
  }, [tab])

  const notify = useCallback(message => setToast({ message, id: Date.now() }), [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  function ensureExerciseIdByName(name){
    const found = db.exercises.find(e => e.name.trim().toLowerCase() === name.trim().toLowerCase())
    if (found) return found.id
    // Recreate it so templates keep working even if you deleted the exercise
    const ex = { id: uid(), name, category: 'Other', equipment: 'Other', isActive: true, createdAt: new Date().toISOString() }
    api.upsertExercise(ex)
    return ex.id
  }

  function startWorkout(template){
    const entries = (template?.items || []).map(item => ({
      key: uid(),
      exerciseId: ensureExerciseIdByName(item.name),
      exerciseName: item.name,
      sets: Array.from({ length: item.sets }, () => ({ weight: '', reps: '' }))
    }))
    setDraft({
      id: uid(),
      profileId: db.activeProfileId,
      startedAt: Date.now(),
      date: todayInput(),
      title: template?.label || '',
      notes: '',
      entries
    })
    scrollByTab.current[tab] = window.scrollY
    scrollByTab.current.log = 0
    setTabState('log')
    window.scrollTo(0, 0)
  }

  if (!activeProfile) return <Welcome api={api} />

  const shared = { db, api, draft, setDraft, notify, startWorkout, setTab }

  return (
    <>
      <main className="app">
        {tab === 'dashboard' && <Dashboard {...shared} profile={activeProfile} />}
        {tab === 'history' && <History {...shared} />}
        {tab === 'log' && <LogWorkout {...shared} />}
        {tab === 'exercises' && <Exercises {...shared} />}
        {tab === 'settings' && <Settings {...shared} />}
      </main>

      <NavBar tab={tab} setTab={setTab} inProgress={!!draft} />

      {toast && (
        <div key={toast.id} className="toast" role="status">
          <Icon name="check" size={18} strokeWidth={2.5} />
          {toast.message}
        </div>
      )}
    </>
  )
}

function Welcome({ api }){
  const [name, setName] = useState('')

  function create(e){
    e.preventDefault()
    if (!name.trim()) return
    api.upsertProfile({ id: uid(), name: name.trim(), createdAt: new Date().toISOString() })
  }

  return (
    <main className="app">
      <form className="screen" onSubmit={create}>
        <header className="page-head">
          <div>
            <div className="eyebrow">Workout Tracker</div>
            <h1 className="title-lg">Welcome</h1>
          </div>
        </header>
        <p className="muted lead">Your workouts are stored on this phone only. No account needed.</p>
        <label className="field">
          <span className="field-label">Your name</span>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., John" autoComplete="given-name" />
        </label>
        <button className="btn btn-primary btn-lg btn-block" disabled={!name.trim()}>Get started</button>
      </form>
    </main>
  )
}
