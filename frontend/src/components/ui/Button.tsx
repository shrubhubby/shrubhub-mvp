import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-forest text-white hover:bg-forest/90 active:bg-forest/80',
    secondary: 'bg-ocean-deep text-white hover:bg-ocean-deep/90 active:bg-ocean-deep/80',
    outline: 'border-2 border-forest text-forest hover:bg-forest/5 active:bg-forest/10',
    ghost: 'text-coal hover:bg-soft active:bg-soft/80',
    icon: 'rounded-full bg-soft text-coal hover:bg-ocean-light hover:text-white active:bg-ocean-mid'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
