import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  elevation?: 1 | 2 | 3
  onClick?: () => void
}

export function Card({ children, className, elevation = 1, onClick }: CardProps) {
  const elevations = {
    1: 'shadow-sm',
    2: 'shadow-md',
    3: 'shadow-lg'
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-soft/50 overflow-hidden',
        'transition-all duration-200',
        elevations[elevation],
        onClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.01]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-3 border-b border-soft/50', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-4', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-3 border-t border-soft/50', className)}>
      {children}
    </div>
  )
}
