import { useRef, useState } from 'react'
import type { Ctx } from '../App'
import { clearAll, exportBackup, importBackup } from '../db/repo'
import { backupNow, restoreFromCloud, signIn, signOut, signUp, useBackupState } from '../cloud/backup'

function ago(t: number | null): string {
  if (!t) return 'never'
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} h ago` : new Date(t).toLocaleDateString()
}

function CloudBackup({ ctx }: { ctx: Ctx }) {
  const b = useBackupState()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function auth(mode: 'in' | 'up') {
    setBusy(true)
    setMsg('')
    const { data, error } = await (mode === 'in' ? signIn(email.trim(), password) : signUp(email.trim(), password))
    setBusy(false)
    if (error) setMsg(error.message)
    else if (mode === 'up' && !data.session) setMsg('Check your email to confirm the account, then sign in here.')
  }

  if (!b.user) {
    return (
      <>
        <p className="sub">Sign in to back up automatically after every change. Your data is private to your account.</p>
        <div className="field">
          <input type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <input type="password" autoComplete="current-password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {msg && <p className="hint">{msg}</p>}
        <div className="actions" style={{ marginTop: 10 }}>
          <button className="primary" disabled={busy || !email || password.length < 6} onClick={() => auth('in')}>
            Sign in
          </button>
          <button className="secondary" disabled={busy || !email || password.length < 6} onClick={() => auth('up')}>
            Create account
          </button>
        </div>
      </>
    )
  }

  const label =
    b.phase === 'saving' ? 'Backing up…' : b.phase === 'pending' ? 'Changes waiting to back up…' : b.phase === 'error' ? `⚠︎ ${b.error ?? 'Backup failed'}` : `✓ Backed up ${ago(b.lastSavedAt)}`
  return (
    <>
      <p className="sub">Signed in as {b.user}</p>
      <p className="status-line">{label}</p>
      <div className="actions" style={{ marginTop: 10 }}>
        <button className="secondary" disabled={b.phase === 'saving'} onClick={() => void backupNow()}>
          Back up now
        </button>
        <button
          className="secondary"
          onClick={async () => {
            if (!window.confirm('Replace everything on this device with your latest cloud backup?')) return
            try {
              ctx.toast({ text: (await restoreFromCloud()) ? 'Restored from cloud' : 'No cloud backup yet' })
            } catch (e) {
              ctx.toast({ text: e instanceof Error ? e.message : 'Restore failed' })
            }
          }}
        >
          Restore from cloud
        </button>
        <button className="secondary" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </>
  )
}

export function Settings({ ctx }: { ctx: Ctx }) {
  const file = useRef<HTMLInputElement>(null)

  async function doExport() {
    const blob = new Blob([await exportBackup()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `challenges-backup-${ctx.today}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function doImport(f: File) {
    if (!window.confirm('Importing replaces everything currently in the app. Continue?')) return
    try {
      await importBackup(await f.text())
      ctx.toast({ text: 'Backup restored' })
    } catch (e) {
      ctx.toast({ text: e instanceof Error ? e.message : 'Could not read that file' })
    }
  }

  return (
    <div className="screen">
      <header>
        <h1>Settings</h1>
      </header>

      <h3 className="section">Cloud backup</h3>
      <CloudBackup ctx={ctx} />

      <h3 className="section">Your data</h3>
      <p className="sub">Everything is stored privately on this device. Export a backup now and then — iOS can clear website data if the app goes unused for a long time.</p>
      <div className="actions">
        <button className="secondary" onClick={doExport}>
          Export backup
        </button>
        <button className="secondary" onClick={() => file.current?.click()}>
          Import backup
        </button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && void doImport(e.target.files[0])} />
        <button
          className="secondary danger"
          onClick={async () => {
            if (window.confirm('Delete ALL challenges and logs?')) await clearAll()
          }}
        >
          Erase everything
        </button>
      </div>

      <h3 className="section">Install on iPhone</h3>
      <p className="sub">Open this page in Safari, tap the Share button, then “Add to Home Screen”. It will open full screen and work offline.</p>
    </div>
  )
}
