import { useState } from 'react'
import type { Challenge } from '../domain/types'
import { chipsFor, fmt } from '../templates'

export function QuickLog({ challenge, progress, target, onClose, onLog }: { challenge: Challenge; progress: number; target: number; onClose: () => void; onLog: (amount: number) => void }) {
  const [text, setText] = useState('')
  const value = parseFloat(text) || 0
  const left = Math.max(0, target - progress)
  const press = (k: string) => {
    if (k === '⌫') return setText((t) => t.slice(0, -1))
    if (k === '.' && text.includes('.')) return
    if (text.length >= 7) return
    setText((t) => (t === '0' && k !== '.' ? k : t + k))
  }
  const add = (n: number) => setText(fmt(value + n))

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Log ${challenge.title}`}>
        <div className="sheet-grip" />
        <div className="sheet-title">
          {challenge.emoji} {challenge.title}
        </div>
        <div className="sheet-sub">
          {fmt(progress)} / {fmt(target)} {challenge.unit} so far · {left > 0 ? `${fmt(left)} to go` : 'target reached'}
        </div>
        <div className="amount" style={{ color: value ? challenge.color : undefined }}>
          {text || '0'}
          <span> {challenge.unit}</span>
        </div>
        <div className="chips">
          {chipsFor(target).map((n) => (
            <button key={n} className="chip" onClick={() => add(n)}>
              +{fmt(n)}
            </button>
          ))}
          {left > 0 && (
            <button className="chip" onClick={() => setText(fmt(left))}>
              Rest ({fmt(left)})
            </button>
          )}
        </div>
        <div className="pad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => (
            <button key={k} onClick={() => press(k)} aria-label={k === '⌫' ? 'Backspace' : k}>
              {k}
            </button>
          ))}
        </div>
        <button className="primary" style={{ background: challenge.color }} disabled={value <= 0} onClick={() => onLog(value)}>
          Log {value > 0 ? `${fmt(value)} ${challenge.unit}` : ''}
        </button>
      </div>
    </div>
  )
}
