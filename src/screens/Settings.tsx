import { useRef } from 'react'
import type { Ctx } from '../App'
import { clearAll, exportBackup, importBackup } from '../db/repo'

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
