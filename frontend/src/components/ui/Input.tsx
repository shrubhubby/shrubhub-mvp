import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-coal mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-coal/60">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-2 rounded-lg border border-soft bg-white text-coal',
              'placeholder:text-coal/40',
              'focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest',
              'disabled:bg-soft/50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-urgent focus:ring-urgent focus:border-urgent',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-urgent mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-coal mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-2 rounded-lg border border-soft bg-white text-coal',
            'placeholder:text-coal/40',
            'focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest',
            'disabled:bg-soft/50 disabled:cursor-not-allowed',
            'transition-all duration-200 resize-none',
            error && 'border-urgent focus:ring-urgent focus:border-urgent',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-urgent mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
