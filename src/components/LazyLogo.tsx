'use client'

import React, { useState, useEffect, useRef } from 'react'

interface LazyLogoProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  width?: number
  height?: number
  onLoad?: () => void
  onError?: () => void
}

export default function LazyLogo({
  src,
  alt,
  className = '',
  placeholder,
  width = 200,
  height = 200,
  onLoad,
  onError
}: LazyLogoProps) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Default placeholder SVG
  const defaultPlaceholder = `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui" font-size="12">
        Loading...
      </text>
    </svg>
  `)}`

  useEffect(() => {
    if (!src || src.trim() === '') {
      setIsLoading(false)
      setHasError(true)
      setImageSrc('')
      return
    }

    // Reset states
    setIsLoading(true)
    setHasError(false)
    setImageSrc(placeholder || defaultPlaceholder)

    // Create a new image to preload
    const img = new Image()
    
    img.onload = () => {
      setImageSrc(src)
      setIsLoading(false)
      onLoad?.()
    }
    
    img.onerror = () => {
      setHasError(true)
      setIsLoading(false)
      onError?.()
    }
    
    // Start loading
    img.src = src
  }, [src, placeholder, defaultPlaceholder, onLoad, onError])

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-xs">
            No Logo
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            isLoading ? 'opacity-50' : 'opacity-100'
          }`}
          style={{ width, height }}
          loading="lazy"
        />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  )
}
