import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-primary text-white hover:opacity-95',
    secondary: 'bg-[#f3f4f6] text-foreground border border-border hover:bg-[#ebecef]',
    ghost: 'bg-transparent text-foreground hover:bg-canvas',
    danger: 'bg-danger text-white',
  }[variant]
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[8px] px-4 h-10 text-sm font-medium transition disabled:opacity-50',
        styles,
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full h-10 rounded-[8px] border border-border bg-[#f7f8f8] px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30',
        className,
      )}
      {...props}
    />
  )
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn('block text-sm font-semibold mb-1.5', className)}>{children}</label>
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-border bg-white shadow-sm', className)}>{children}</div>
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#f3f4f6] text-foreground', className)}>
      {children}
    </span>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-[#f3f4f6] mb-4" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {body ? <p className="text-muted mt-1 max-w-md text-sm">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
