import React from 'react'
import { cx, initials } from '../lib/format'

export function Card(props: {
  title?: string
  subtitle?: string
  children: React.ReactNode
  right?: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section
      className={cx(
        'min-w-0 rounded-[30px] border border-white/70 bg-[var(--surface)] shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur',
        props.className,
      )}
    >
      {(props.title || props.right) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-4">
          <div className="min-w-0">
            {props.title ? <h2 className="text-base font-semibold text-slate-950">{props.title}</h2> : null}
            {props.subtitle ? <p className="mt-1 text-sm text-slate-600">{props.subtitle}</p> : null}
          </div>
          {props.right ? <div className="shrink-0">{props.right}</div> : null}
        </div>
      )}
      <div className={cx('min-w-0 p-5', props.bodyClassName)}>{props.children}</div>
    </section>
  )
}

export function PageHeader(props: {
  kicker?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {props.kicker ? (
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-ink)]">
            {props.kicker}
          </div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{props.title}</h1>
        {props.description ? <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{props.description}</p> : null}
      </div>
      {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
    </div>
  )
}

export function MetricCard(props: {
  label: string
  value: React.ReactNode
  caption?: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={props.className}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{props.label}</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{props.value}</div>
          {props.caption ? <div className="mt-2 text-sm text-slate-600">{props.caption}</div> : null}
        </div>
        {props.icon ? (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            {props.icon}
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export function AvatarBadge(props: { name: string; subtitle?: string; size?: 'sm' | 'md' }) {
  const size = props.size ?? 'md'
  return (
    <div className="flex items-center gap-3">
      <div
        className={cx(
          'grid shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] font-semibold text-[var(--accent)]',
          size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm',
        )}
      >
        {initials(props.name)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-950">{props.name}</div>
        {props.subtitle ? <div className="truncate text-xs text-slate-500">{props.subtitle}</div> : null}
      </div>
    </div>
  )
}

export function EmptyState(props: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
      <div className="text-lg font-semibold text-slate-950">{props.title}</div>
      <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{props.message}</div>
      {props.action ? <div className="mt-5">{props.action}</div> : null}
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const { label, hint, className, ...rest } = props
  return (
    <label className="block min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
        {hint ? <div className="text-[11px] text-slate-400">{hint}</div> : null}
      </div>
      <input
        {...rest}
        className={cx(
          'min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]',
          className,
        )}
      />
    </label>
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const { label, hint, className, ...rest } = props
  return (
    <label className="block min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
        {hint ? <div className="text-[11px] text-slate-400">{hint}</div> : null}
      </div>
      <textarea
        {...rest}
        className={cx(
          'min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]',
          className,
        )}
      />
    </label>
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  const { label, hint, children, className, ...rest } = props
  return (
    <label className="block min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
        {hint ? <div className="text-[11px] text-slate-400">{hint}</div> : null}
      </div>
      <select
        {...rest}
        className={cx(
          'min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]',
          className,
        )}
      >
        {children}
      </select>
    </label>
  )
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const { variant = 'primary', className, ...rest } = props
  const base =
    'inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60'
  const v =
    variant === 'primary'
      ? 'bg-[var(--accent)] text-white shadow-[0_18px_30px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 hover:bg-[var(--accent-2)]'
      : variant === 'secondary'
        ? 'border border-transparent bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[rgba(15,118,110,0.18)]'
        : variant === 'danger'
          ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
          : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
  return <button {...rest} className={[base, v, className].filter(Boolean).join(' ')} />
}

export function ErrorBox(props: { message: string }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{props.message}</div>
}

export function Pill(props: {
  children: React.ReactNode
  tone?: 'slate' | 'red' | 'green' | 'amber' | 'violet' | 'teal'
  className?: string
}) {
  const tone = props.tone ?? 'slate'
  const cls =
    tone === 'red'
      ? 'bg-rose-50 text-rose-800 border-rose-200'
      : tone === 'green'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : tone === 'amber'
          ? 'bg-amber-50 text-amber-900 border-amber-200'
        : tone === 'violet'
            ? 'bg-violet-50 text-violet-800 border-violet-200'
          : tone === 'teal'
            ? 'bg-teal-50 text-teal-800 border-teal-200'
            : 'bg-slate-50 text-slate-700 border-slate-200'
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', cls, props.className)}>
      {props.children}
    </span>
  )
}

export function ProgressBar(props: { value: number }) {
  const v = Math.max(0, Math.min(100, props.value))
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
        style={{ width: `${v}%` }}
      />
    </div>
  )
}
