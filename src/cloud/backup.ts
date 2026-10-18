import { useSyncExternalStore } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { db } from '../db/db'
import { exportBackup, importBackup, onDataChange } from '../db/repo'

export type BackupState = {
  user: string | null
  phase: 'off' | 'idle' | 'pending' | 'saving' | 'saved' | 'error'
  lastSavedAt: number | null
  error: string | null
}

const KEEP = 30
const DEBOUNCE_MS = 4000

let state: BackupState = { user: null, phase: 'off', lastSavedAt: null, error: null }
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | undefined
let running: Promise<void> | null = null
let rerun = false
let notify: ((msg: string) => void) | undefined

function set(patch: Partial<BackupState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useBackupState(): BackupState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

async function hasLocalData(): Promise<boolean> {
  return (await db.challenges.count()) > 0
}

async function upload(): Promise<void> {
  if (!state.user) return
  // Never overwrite the cloud history with an empty database (e.g. after "Erase everything").
  if (!(await hasLocalData())) return set({ phase: 'idle' })
  set({ phase: 'saving', error: null })
  const data = JSON.parse(await exportBackup())
  const { error } = await supabase.from('backups').insert({ data })
  if (error) throw error
  const { data: rows } = await supabase.from('backups').select('id').order('created_at', { ascending: false }).range(KEEP, KEEP + 200)
  if (rows?.length) await supabase.from('backups').delete().in('id', rows.map((r) => r.id))
  set({ phase: 'saved', lastSavedAt: Date.now() })
}

async function run() {
  if (running) {
    rerun = true
    return running
  }
  running = (async () => {
    try {
      do {
        rerun = false
        await upload()
      } while (rerun)
    } catch (e) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Backup failed'
      set({ phase: 'error', error: msg })
      notify?.('⚠︎ Cloud backup failed — will retry on the next change')
    } finally {
      running = null
    }
  })()
  return running
}

/** Back up right now (cancels any pending debounce). */
export function backupNow() {
  clearTimeout(timer)
  return run()
}

function schedule() {
  if (!state.user) return
  set({ phase: 'pending' })
  clearTimeout(timer)
  timer = setTimeout(() => void run(), DEBOUNCE_MS)
}

export async function latestCloudBackup(): Promise<{ data: unknown; created_at: string } | null> {
  const { data, error } = await supabase.from('backups').select('data, created_at').order('created_at', { ascending: false }).limit(1)
  if (error) throw error
  return data?.[0] ?? null
}

export async function restoreFromCloud(): Promise<boolean> {
  const b = await latestCloudBackup()
  if (!b) return false
  await importBackup(JSON.stringify(b.data), { silent: true })
  return true
}

export const signIn = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password })
export const signUp = (email: string, password: string) => supabase.auth.signUp({ email, password })
export const signOut = () => supabase.auth.signOut()

async function onSession(session: Session | null, first: boolean) {
  const user = session?.user.email ?? null
  if (!user) return set({ user: null, phase: 'off', lastSavedAt: null, error: null })
  set({ user, phase: 'idle' })
  try {
    const cloud = await latestCloudBackup()
    if (cloud) set({ lastSavedAt: new Date(cloud.created_at).getTime() })
    if (await hasLocalData()) await run()
    else if (cloud && first) notify?.('☁︎ Cloud backup found — restore it in Settings')
  } catch (e) {
    set({ phase: 'error', error: e instanceof Error ? e.message : 'Could not reach the cloud' })
  }
}

let started = false
export function startAutoBackup(onMessage: (msg: string) => void) {
  notify = onMessage
  if (started) return
  started = true
  onDataChange(schedule)
  supabase.auth.getSession().then(({ data }) => onSession(data.session, true))
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(() => void onSession(session, event === 'SIGNED_IN'), 0)
  })
  // Don't lose a pending change when the app is backgrounded or closed.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && state.phase === 'pending') void backupNow()
  })
  window.addEventListener('online', () => {
    if (state.phase === 'error') void backupNow()
  })
}
