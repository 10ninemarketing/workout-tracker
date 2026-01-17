import React from 'react'

export default function NavBar({ tab, setTab }){
  const items = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'log', label: 'Log' },
    { key: 'exercises', label: 'Exercises' },
    { key: 'settings', label: 'Settings' }
  ]

  return (
    <div className="navbar">
      <div className="inner">
        {items.map(it => (
          <button
            key={it.key}
            className={tab === it.key ? 'active' : ''}
            onClick={()=>setTab(it.key)}
          >
            <div style={{fontSize:12}}>{it.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
