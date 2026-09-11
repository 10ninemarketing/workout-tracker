import React, { useEffect, useRef, useState } from 'react'
import { shortDate } from '../lib/workout.js'

function useWidth(){
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

// One exercise, one line: the top set of every session, oldest to newest.
export default function ProgressChart({ points, units, metric }){
  const [ref, width] = useWidth()
  const [active, setActive] = useState(null)

  const height = 170
  const pad = { top: 18, right: 14, bottom: 26, left: 40 }
  const valueOf = p => (metric === 'reps' ? p.reps : p.weight)
  const label = p => (metric === 'reps' ? `${p.reps} reps` : `${p.weight} ${units} × ${p.reps}`)

  if (width === 0) return <div className="chart" ref={ref} style={{ height }} />

  const values = points.map(valueOf)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || Math.max(hi * 0.1, 5)
  const yMin = Math.max(0, lo - span * 0.35)
  const yMax = hi + span * 0.35

  const innerW = Math.max(1, width - pad.left - pad.right)
  const innerH = height - pad.top - pad.bottom
  const times = points.map(p => new Date(p.dateIso).getTime())
  const tMin = Math.min(...times)
  const tMax = Math.max(...times)

  const xOf = t => (tMax === tMin ? pad.left + innerW / 2 : pad.left + ((t - tMin) / (tMax - tMin)) * innerW)
  const yOf = v => pad.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH

  const coords = points.map((p, i) => ({ ...p, x: xOf(times[i]), y: yOf(valueOf(p)), v: valueOf(p) }))
  const last = coords[coords.length - 1]
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const area = `${line} L${last.x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} L${coords[0].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`
  const ticks = Array.from(new Set([Math.round(yMax), Math.round((yMin + yMax) / 2), Math.round(yMin)]))

  function track(e){
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    let best = 0
    let bestDistance = Infinity
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - px)
      if (d < bestDistance){ bestDistance = d; best = i }
    })
    setActive(best)
  }

  const tip = active === null ? null : coords[active]

  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={height} role="img" aria-label={`Top set per workout, ${shortDate(points[0].dateIso)} to ${shortDate(points[points.length - 1].dateIso)}`}>
        {ticks.map(v => (
          <g key={v}>
            <line className="grid" x1={pad.left} x2={width - pad.right} y1={yOf(v)} y2={yOf(v)} />
            <text className="axis" x={pad.left - 8} y={yOf(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}

        {coords.length > 1 && <path className="chart-area" d={area} />}
        {coords.length > 1 && <path className="chart-line" d={line} />}

        {tip && <line className="crosshair" x1={tip.x} x2={tip.x} y1={pad.top} y2={pad.top + innerH} />}

        {coords.map((c, i) => (
          <circle key={i} className="chart-dot" cx={c.x} cy={c.y} r={active === i ? 5.5 : 4} />
        ))}

        <text
          className="chart-endlabel"
          x={last.x}
          y={last.y - 12}
          textAnchor={coords.length > 1 ? 'end' : 'middle'}
        >
          {last.v}{metric === 'reps' ? ' reps' : ` ${units}`}
        </text>

        {coords.length > 1 && <text className="axis" x={pad.left} y={height - 6}>{shortDate(points[0].dateIso)}</text>}
        <text className="axis" x={coords.length > 1 ? width - pad.right : last.x} y={height - 6} textAnchor={coords.length > 1 ? 'end' : 'middle'}>
          {shortDate(points[points.length - 1].dateIso)}
        </text>

        <rect
          x="0" y="0" width={width} height={height} fill="transparent"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={track}
          onPointerMove={track}
          onPointerLeave={() => setActive(null)}
          onPointerUp={() => setActive(null)}
        />
      </svg>

      {tip && (
        <div
          className="chart-tip"
          style={{ left: Math.min(Math.max(tip.x, 54), width - 54), top: tip.y - 14 }}
        >
          <strong>{label(tip)}</strong>
          <span>{shortDate(tip.dateIso)}</span>
        </div>
      )}
    </div>
  )
}
