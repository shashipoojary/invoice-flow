'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

interface CustomDropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  isDarkMode?: boolean
  className?: string
  error?: boolean
  searchable?: boolean
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  isDarkMode = false,
  className = '',
  error = false,
  searchable = false
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    const handleScroll = (e: Event) => {
      // Only close if scrolling outside the dropdown menu
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Also close on scroll (but not when scrolling inside dropdown)
      window.addEventListener('scroll', handleScroll, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (optionValue: string) => {
    if (disabled) return
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <>
      <div ref={dropdownRef} className={`relative ${className}`}>
        {/* Trigger Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2.5 text-sm border transition-colors text-left flex items-center justify-between ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : isDarkMode
              ? 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
              : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
          } ${
            disabled
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
          }`}
        >
          <span className={selectedOption ? '' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Dropdown Menu - Portal to body */}
      {isOpen && !disabled && typeof window !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className={`fixed border shadow-lg ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            maxHeight: searchable ? '320px' : '300px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Search Input (if searchable) */}
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className={`w-full px-2 py-1.5 text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                autoFocus
              />
            </div>
          )}

          {/* Options List - Fully scrollable */}
          <div 
            className="overflow-y-auto overflow-x-hidden"
            style={{ 
              maxHeight: searchable ? '260px' : '300px',
              minHeight: 0,
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              scrollbarWidth: 'thin',
              scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : '#CBD5E1 #F3F4F6'
            }}
            onWheel={(e) => {
              // Prevent parent scroll when scrolling dropdown
              e.stopPropagation()
            }}
            onTouchMove={(e) => {
              // Prevent parent scroll when scrolling dropdown on touch devices
              e.stopPropagation()
            }}
            onScroll={(e) => {
              // Prevent scroll event from bubbling up
              e.stopPropagation()
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className={`px-3 py-2 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value
                const isDisabled = option.disabled

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !isDisabled && handleSelect(option.value)}
                    disabled={isDisabled}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'bg-indigo-50 text-indigo-600'
                        : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-900 hover:bg-gray-50'
                    } ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-600" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

