import { useCallback, useEffect, useState } from 'react'
import { startAutoBackup } from './cloud/backup'
import { useData, useToday } from './data'
import { Today } from './screens/Today'
import { NewChallenge } from './screens/NewChallenge'
import { Detail } from './screens/Detail'
import { Archive } from './screens/Archive'
import { Settings } from './screens/Settings'
import { Confetti } from './components/Confetti'

export type View = { name: 'today' } | { name: 'new' } | { name: 'archive' } | { name: 'settings' } | { name: 'detail'; id: string } | { name: 'edit'; id: string }

export interface Toast {
  text: string
  undo?: () => void
}

export interface Ctx {
  today: string
  go: (v: View) => void
  toast: (t: Toast) => void
  celebrate: (big?: boolean) => void
}

export default function App() {
  const [view, setView] = useState<View>({ name: 'today' })
  const [toast, setToast] = useState<(Toast & { key: number }) | null>(null)
  const [burst, setBurst] = useState({ n: 0, big: false })
  const today = useToday()
  const data = useData()

  const showToast = useCallback((t: Toast) => {
    const key = Date.now()
    setToast({ ...t, key })
    setTimeout(() => setToast((cur) => (cur?.key === key ? null : cur)), 4000)
  }, [])
  const celebrate = useCallback((big = false) => setBurst((b) => ({ n: b.n + 1, big })), [])
  useEffect(() => startAutoBackup((text) => showToast({ text })), [showToast])
  const ctx: Ctx = { today, go: setView, toast: showToast, celebrate }

  const tab = view.name === 'detail' || view.name === 'new' || view.name === 'edit' ? null : view.name

  return (
    <div className="app">
      <main>
        {!data.ready ? null : view.name === 'today' ? (
          <Today ctx={ctx} data={data} />
        ) : view.name === 'new' ? (
          <NewChallenge ctx={ctx} />
        ) : view.name === 'edit' ? (
          <NewChallenge ctx={ctx} challenge={data.challenges.find((c) => c.id === view.id)} />
        ) : view.name === 'detail' ? (
          <Detail ctx={ctx} data={data} id={view.id} />
        ) : view.name === 'archive' ? (
          <Archive ctx={ctx} data={data} />
        ) : (
          <Settings ctx={ctx} />
        )}
      </main>

      {tab && (
        <nav className="tabbar">
          <button className={tab === 'today' ? 'on' : ''} onClick={() => setView({ name: 'today' })}>
            <span>◎</span>Today
          </button>
          <button className="add" onClick={() => setView({ name: 'new' })} aria-label="New challenge">
            +
          </button>
          <button className={tab === 'archive' ? 'on' : ''} onClick={() => setView({ name: 'archive' })}>
            <span>▤</span>History
          </button>
          <button className={tab === 'settings' ? 'on' : ''} onClick={() => setView({ name: 'settings' })}>
            <span>⚙︎</span>Settings
          </button>
        </nav>
      )}

      {toast && (
        <div className="toast" key={toast.key}>
          {toast.text}
          {toast.undo && (
            <button
              onClick={() => {
                toast.undo?.()
                setToast(null)
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
      <Confetti burst={burst.n} big={burst.big} />
    </div>
  )
}
