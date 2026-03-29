import React from 'react'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
  }

  return (
    <div
      className={cn(
        'rounded-full bg-ocean-mist flex items-center justify-center overflow-hidden',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <User size={iconSizes[size]} className="text-ocean-mid" />
      )}
    </div>
  )
}
