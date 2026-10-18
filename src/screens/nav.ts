import type { Ctx } from '../App'
import type { Template } from '../templates'

/** One-shot hand-off of a template to the New Challenge screen. */
let pending: Template | null = null

export function goNew(ctx: Ctx, t?: Template) {
  pending = t ?? null
  ctx.go({ name: 'new' })
}

export function takePending(): Template | null {
  const t = pending
  pending = null
  return t
}
