import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'healthy' | 'attention' | 'urgent' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'neutral', size = 'md', className }: BadgeProps) {
  const variants = {
    healthy: 'bg-healthy/10 text-healthy border-healthy/20',
    attention: 'bg-attention/10 text-attention border-attention/20',
    urgent: 'bg-urgent/10 text-urgent border-urgent/20',
    neutral: 'bg-soft text-coal border-soft'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
