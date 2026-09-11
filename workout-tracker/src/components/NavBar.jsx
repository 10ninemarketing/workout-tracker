import React from 'react'
import { Icon } from './Icons.jsx'

const ITEMS = [
  { key: 'dashboard', label: 'Home', icon: 'home' },
  { key: 'history', label: 'History', icon: 'clock' },
  { key: 'log', label: 'Workout', icon: 'dumbbell' },
  { key: 'exercises', label: 'Exercises', icon: 'list' },
  { key: 'settings', label: 'Settings', icon: 'sliders' }
]

export default function NavBar({ tab, setTab, inProgress }){
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-inner">
        {ITEMS.map(it => (
          <button
            key={it.key}
            className="tab"
            aria-current={tab === it.key ? 'page' : undefined}
            onClick={() => setTab(it.key)}
          >
            <span className="tab-icon">
              <Icon name={it.icon} size={24} />
              {it.key === 'log' && inProgress && <span className="tab-dot" aria-label="Workout in progress" />}
            </span>
            <span>{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
