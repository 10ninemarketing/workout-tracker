import React, { useMemo, useState } from 'react'
import { Icon } from '../components/Icons.jsx'
import Sheet from '../components/Sheet.jsx'
import { uid, todayInput, friendlyDate } from '../lib/workout.js'
import {
  MACROS, num, entryMacros, sumMacros, logForDate, foodsByUse,
  weightsFor, rollingAverage, weightTrend, round, fmt
} from '../lib/nutrition.js'

function shiftDate(date, days){
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function Food({ db, api, notify }){
  const today = todayInput()
  const [date, setDate] = useState(today)
  const [picking, setPicking] = useState(false)
  const [editing, setEditing] = useState(null)

  const targets = db.settings.targets || {}
  const entries = useMemo(() => logForDate(db, date), [db, date])
  const totals = useMemo(() => sumMacros(entries), [entries])
  const weights = useMemo(() => weightsFor(db), [db])

  const avg = rollingAverage(weights)
  const trend = weightTrend(weights)
  const todaysWeight = weights.find(w => w.date === date)

  function addFood(food, servings = 1){
    api.addFoodLog({
      id: uid(),
      profileId: db.activeProfileId,
      date,
      foodId: food.id,
      // Snapshot so editing the food later never rewrites this day
      foodName: food.name,
      brand: food.brand || '',
      serving: food.serving || '',
      servings,
      kcal: num(food.kcal),
      protein: num(food.protein),
      carbs: num(food.carbs),
      fat: num(food.fat),
      satFat: num(food.satFat),
      createdAt: new Date().toISOString()
    })
    setPicking(false)
    notify(`${food.name} added`)
  }

  function saveFood(food){
    api.upsertFood(food)
    setEditing(null)
    notify(editing?.isNew ? 'Food saved' : 'Food updated')
    if (editing?.isNew && editing?.logAfterSave) addFood(food)
  }

  function setWeightValue(raw){
    api.setWeight({
      id: uid(),
      profileId: db.activeProfileId,
      date,
      lbs: raw === '' ? '' : num(raw)
    })
  }

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <div className="eyebrow">{date === today ? 'Today' : friendlyDate(date + 'T12:00:00')}</div>
          <h1 className="title-lg">Food</h1>
        </div>
        <div className="day-nav">
          <button className="icon-btn icon-btn-sm" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day">
            <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button
            className="icon-btn icon-btn-sm"
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={date >= today}
            aria-label="Next day"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </header>

      <section className="card">
        <div className="card-head">
          <div className="card-title">{fmt(totals.kcal)} <span className="muted">/ {fmt(targets.kcal)}</span></div>
          <div className={`delta${totals.kcal > num(targets.kcal) ? '' : ' up'}`}>
            {totals.kcal > num(targets.kcal)
              ? `${fmt(totals.kcal - num(targets.kcal))} over`
              : `${fmt(num(targets.kcal) - totals.kcal)} left`}
          </div>
        </div>
        <div className="macro-bars">
          {MACROS.map(m => {
            const got = totals[m.key]
            const want = num(targets[m.key])
            const pct = want > 0 ? Math.min(100, (got / want) * 100) : 0
            // A limit is breached the moment it is passed; a goal gets slack
            const over = want > 0 && got > want * (m.limit ? 1 : 1.05)
            return (
              <div key={m.key} className={`macro${m.sub ? ' macro-sub' : ''}`}>
                <div className="macro-top">
                  <span className="macro-label">
                    {m.sub && <span className="macro-branch" aria-hidden="true" />}
                    {m.label}
                    {m.limit && <span className="macro-cap"> limit</span>}
                  </span>
                  <span className="macro-value num">{fmt(got)}<span className="faint"> / {fmt(want)}{m.unit}</span></span>
                </div>
                <div className="macro-track">
                  <div className={`macro-fill${over ? ' over' : ''}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <button className="btn btn-primary btn-lg btn-block" onClick={() => setPicking(true)}>
        <Icon name="plus" size={18} strokeWidth={2.5} /> Add food
      </button>

      {entries.length === 0 ? (
        <div className="card empty">
          <div className="empty-title">Nothing logged{date === today ? ' today' : ''}</div>
          <div className="muted small">Add a food once with its label macros, then it is two taps forever after.</div>
        </div>
      ) : (
        <div className="list">
          {entries.map(e => {
            const m = entryMacros(e)
            return (
              <div key={e.id} className="list-row">
                <span className="row-main">
                  <span className="row-title">{e.foodName}</span>
                  <span className="row-sub">
                    {e.brand ? `${e.brand} · ` : ''}{e.serving || 'serving'}
                    {' · '}{fmt(m.protein)}p {fmt(m.carbs)}c {fmt(m.fat)}f
                    {m.satFat >= 1 && <span className="sat-flag"> {fmt(m.satFat)}g sat</span>}
                  </span>
                </span>
                <input
                  className="input input-qty num"
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min="0"
                  value={e.servings}
                  onChange={ev => api.updateFoodLog(e.id, { servings: ev.target.value })}
                  aria-label={`Servings of ${e.foodName}`}
                />
                <span className="best-value num">{fmt(m.kcal)}</span>
                <button className="icon-btn icon-btn-sm" onClick={() => api.deleteFoodLog(e.id)} aria-label={`Remove ${e.foodName}`}>
                  <Icon name="x" size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <section className="card">
        <div className="card-head"><div className="card-title">Bodyweight</div></div>
        <label className="field">
          <span className="field-label">{date === today ? 'This morning' : friendlyDate(date + 'T12:00:00')} (lb)</span>
          <input
            className="input num"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="—"
            value={todaysWeight?.lbs ?? ''}
            onChange={ev => setWeightValue(ev.target.value)}
          />
        </label>
        {avg != null && (
          <div className="stat-row" style={{ marginTop: 14 }}>
            <div>
              <div className="stat-value">{round(avg, 1)}</div>
              <div className="stat-label">7-day average</div>
            </div>
            <div>
              <div className={`stat-value${trend != null && trend < 0 ? ' accent-text' : ''}`}>
                {trend == null ? '—' : `${trend > 0 ? '+' : ''}${round(trend, 1)}`}
              </div>
              <div className="stat-label">vs week before</div>
            </div>
            <div>
              <div className="stat-value">{weights.length}</div>
              <div className="stat-label">Weigh-ins</div>
            </div>
          </div>
        )}
        <p className="footnote">Weigh in every morning after the bathroom, before food or water. Read the average, never the daily number.</p>
      </section>

      <FoodPicker
        open={picking}
        onClose={() => setPicking(false)}
        db={db}
        api={api}
        onPick={addFood}
        onNew={() => { setPicking(false); setEditing({ isNew: true, logAfterSave: true }) }}
        onEdit={food => { setPicking(false); setEditing(food) }}
      />

      <FoodForm
        open={!!editing}
        food={editing}
        onClose={() => setEditing(null)}
        onSave={saveFood}
        onDelete={id => { api.deleteFood(id); setEditing(null); notify('Food deleted') }}
      />
    </div>
  )
}

function FoodPicker({ open, onClose, db, api, onPick, onNew, onEdit }){
  const [q, setQ] = useState('')
  const foods = useMemo(() => foodsByUse(db), [db])
  const needle = q.trim().toLowerCase()
  const shown = needle
    ? foods.filter(f => `${f.name} ${f.brand || ''}`.toLowerCase().includes(needle))
    : foods

  return (
    <Sheet open={open} onClose={onClose} title="Add food" full>
      <div className="sheet-search">
        <div className="search">
          <Icon name="search" size={18} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search your foods" autoComplete="off" />
        </div>
      </div>

      <button className="btn btn-dashed btn-block picker-create" onClick={onNew}>
        <Icon name="plus" size={17} /> New food{needle ? ` "${q.trim()}"` : ''}
      </button>

      {shown.length === 0 ? (
        <div className="empty muted">
          {foods.length === 0
            ? 'Your food library is empty. Add the things you actually eat and logging gets fast.'
            : 'No match.'}
        </div>
      ) : (
        <div className="list">
          {shown.map(f => (
            <div key={f.id} className="list-row">
              <button className="row-btn row-main" onClick={() => onPick(f)}>
                <span className="row-title">{f.name}</span>
                <span className="row-sub">
                  {f.brand ? `${f.brand} · ` : ''}{f.serving || 'serving'}
                  {' · '}{fmt(f.kcal)} kcal · {fmt(f.protein)}p
                </span>
              </button>
              <button className="icon-btn icon-btn-sm" onClick={() => onEdit(f)} aria-label={`Edit ${f.name}`}>
                <Icon name="sliders" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  )
}

const BLANK = { name: '', brand: '', serving: '', kcal: '', protein: '', carbs: '', fat: '', satFat: '' }

function FoodForm({ open, food, onClose, onSave, onDelete }){
  const isNew = !food?.id
  const [form, setForm] = useState(BLANK)
  const [key, setKey] = useState(null)

  // Reset when a different food opens, without an effect
  const openKey = food ? (food.id || 'new') : null
  if (open && openKey !== key){
    setKey(openKey)
    setForm(isNew ? BLANK : { ...BLANK, ...food })
  }

  function field(name, label, props = {}){
    return (
      <label className="field">
        <span className="field-label">{label}</span>
        <input
          className="input"
          value={form[name] ?? ''}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          {...props}
        />
      </label>
    )
  }

  function submit(e){
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({
      id: food?.id || uid(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      serving: form.serving.trim(),
      kcal: num(form.kcal),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
      satFat: num(form.satFat),
      createdAt: food?.createdAt || new Date().toISOString()
    })
  }

  const macroProps = { type: 'number', inputMode: 'decimal', min: '0', placeholder: '0' }
  const computed = num(form.protein) * 4 + num(form.carbs) * 4 + num(form.fat) * 9
  const stated = num(form.kcal)
  const mismatch = stated > 0 && computed > 0 && Math.abs(stated - computed) > Math.max(25, stated * 0.12)
  const satTooHigh = num(form.satFat) > num(form.fat)

  return (
    <Sheet open={open} onClose={onClose} title={isNew ? 'New food' : form.name || 'Food'} full>
      <form className="vstack" onSubmit={submit}>
        {field('name', 'Name', { placeholder: 'e.g., Sockeye salmon fillet', autoComplete: 'off' })}
        {field('brand', 'Brand', { placeholder: 'optional', autoComplete: 'off' })}
        {field('serving', 'Serving', { placeholder: 'e.g., 6 oz, 1 scoop, 100 g', autoComplete: 'off' })}

        <div className="section-label">Per serving, off the label</div>
        <div className="row2">
          {field('kcal', 'Calories', macroProps)}
          {field('protein', 'Protein (g)', macroProps)}
        </div>
        <div className="row2">
          {field('carbs', 'Carbs (g)', macroProps)}
          {field('fat', 'Fat (g)', macroProps)}
        </div>
        {field('satFat', 'of which saturated (g)', macroProps)}

        {satTooHigh && (
          <p className="footnote danger-text">
            Saturated fat is part of total fat, so it cannot be the larger of the two.
          </p>
        )}

        {mismatch && (
          <p className="footnote danger-text">
            The macros work out to {fmt(computed)} kcal, not {fmt(stated)}. Worth a second look at the label.
          </p>
        )}

        <button className="btn btn-primary btn-lg btn-block" disabled={!form.name.trim()}>
          {isNew ? 'Save and log it' : 'Save changes'}
        </button>

        {!isNew && (
          <button type="button" className="btn btn-danger btn-block" onClick={() => onDelete(food.id)}>
            Delete food
          </button>
        )}
        <p className="footnote">
          Editing a food changes it going forward only. Days you have already logged keep the numbers you ate.
        </p>
      </form>
    </Sheet>
  )
}
