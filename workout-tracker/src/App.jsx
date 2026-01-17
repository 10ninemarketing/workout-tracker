import React, { useMemo, useState } from 'react'
import NavBar from './components/NavBar.jsx'
import Dashboard from './screens/Dashboard.jsx'
import LogWorkout from './screens/LogWorkout.jsx'
import Exercises from './screens/Exercises.jsx'
import Settings from './screens/Settings.jsx'
import { useDB } from './storage/useDB.js'

export default function App(){
  const { db, api } = useDB()
  const [tab, setTab] = useState('dashboard')

  const activeProfile = useMemo(
    ()=>db.profiles.find(p=>p.id === db.activeProfileId) || null,
    [db.profiles, db.activeProfileId]
  )

  // First-run setup if no profiles
  if (!activeProfile){
    return (
      <div className="container">
        <div className="card vstack">
          <h2 style={{margin:0}}>Create your profile</h2>
          <p className="muted" style={{margin:0}}>
            This app stores data on this phone only (no accounts). You can add more profiles later.
          </p>
          <Settings db={db} api={api} onlyProfileSetup />
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="hstack" style={{justifyContent:'space-between', marginBottom:12}}>
        <div>
          <div style={{fontSize:20, fontWeight:700}}>Workout Tracker</div>
          <div className="muted" style={{fontSize:13}}>Active profile: <b>{activeProfile.name}</b></div>
        </div>
        <div className="pill">Local-only • {db.settings.units.toUpperCase()}</div>
      </div>

      {tab === 'dashboard' && <Dashboard db={db} api={api} />}
      {tab === 'log' && <LogWorkout db={db} api={api} />}
      {tab === 'exercises' && <Exercises db={db} api={api} />}
      {tab === 'settings' && <Settings db={db} api={api} />}

      <NavBar tab={tab} setTab={setTab} />
    </div>
  )
}
