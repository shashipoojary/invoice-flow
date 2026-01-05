'use client'

import React, { useState } from 'react'
import { Palette, Check, FileText, Layout, PenTool } from 'lucide-react'

interface TemplateSelectorProps {
  selectedTemplate: number
  onTemplateSelect: (template: number) => void
  primaryColor: string
  onPrimaryColorChange: (color: string) => void
  secondaryColor: string
  onSecondaryColorChange: (color: string) => void
  isDarkMode?: boolean
}

const templatePreviews = [
  {
    id: 1,
    name: 'Minimal',
    description: 'Clean and simple',
    icon: FileText,
    defaultPrimary: '#5C2D91',
    defaultSecondary: '#8B5CF6',
    pdfTemplate: 6 // Maps to Template 6 (Minimal - Finalized)
  },
  {
    id: 2,
    name: 'Modern',
    description: 'Sleek and minimal',
    icon: Layout,
    defaultPrimary: '#7C3AED',
    defaultSecondary: '#A855F7',
    pdfTemplate: 4 // Maps to Template 4 (Modern)
  },
  {
    id: 3,
    name: 'Creative',
    description: 'Bold and dynamic',
    icon: PenTool,
    defaultPrimary: '#8B5CF6',
    defaultSecondary: '#F59E0B',
    pdfTemplate: 5 // Maps to Template 5 (Simple Clean)
  }
]

const colorPresets = [
  { name: 'Purple', primary: '#5C2D91', secondary: '#8B5CF6' },
  { name: 'Blue', primary: '#1E40AF', secondary: '#3B82F6' },
  { name: 'Green', primary: '#059669', secondary: '#10B981' },
  { name: 'Red', primary: '#DC2626', secondary: '#EF4444' },
  { name: 'Orange', primary: '#EA580C', secondary: '#F97316' },
  { name: 'Pink', primary: '#DB2777', secondary: '#EC4899' },
  { name: 'Indigo', primary: '#4338CA', secondary: '#6366F1' },
  { name: 'Teal', primary: '#0D9488', secondary: '#14B8A6' },
  { name: 'Black', primary: '#1F2937', secondary: '#374151' },
  { name: 'Dark Gray', primary: '#374151', secondary: '#6B7280' },
  { name: 'Navy', primary: '#1E3A8A', secondary: '#3B82F6' },
  { name: 'Emerald', primary: '#047857', secondary: '#10B981' },
  { name: 'Rose', primary: '#BE185D', secondary: '#F43F5E' },
  { name: 'Amber', primary: '#D97706', secondary: '#F59E0B' },
  { name: 'Cyan', primary: '#0891B2', secondary: '#06B6D4' },
  { name: 'Violet', primary: '#7C2D12', secondary: '#A855F7' }
]

export default function TemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  primaryColor,
  onPrimaryColorChange,
  secondaryColor,
  onSecondaryColorChange,
  isDarkMode = false
}: TemplateSelectorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const handleTemplateSelect = (templateId: number) => {
    onTemplateSelect(templateId)
    const template = templatePreviews.find(t => t.id === templateId)
    if (template) {
      onPrimaryColorChange(template.defaultPrimary)
      onSecondaryColorChange(template.defaultSecondary)
    }
  }

  const handleColorPreset = (primary: string, secondary: string, presetName: string) => {
    onPrimaryColorChange(primary)
    onSecondaryColorChange(secondary)
    setSelectedPreset(presetName)
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <h3 className={`text-sm font-semibold mb-4 flex items-center ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Palette className="h-4 w-4 mr-2 text-indigo-600" />
          Choose Template
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templatePreviews.map((template) => {
            const IconComponent = template.icon;
            const isSelected = selectedTemplate === template.id;
            
            return (
              <div
                key={template.id}
                data-testid={`template-${template.id}`}
                onClick={() => handleTemplateSelect(template.id)}
                className={`relative cursor-pointer border p-3 transition-all duration-200 ${
                  isSelected
                    ? isDarkMode
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-indigo-500 bg-indigo-50'
                    : isDarkMode
                    ? 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                
                {/* Template Preview */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div 
                    className="w-10 h-10 flex items-center justify-center text-white shadow-sm bg-indigo-600"
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {template.name}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {template.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color Customization */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Customize Colors
          </h3>
          <button
            type="button"
            data-testid="toggle-color-picker"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`text-xs font-medium px-3 py-1.5 transition-colors cursor-pointer ${
              showColorPicker
                ? 'bg-indigo-600 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showColorPicker ? 'Hide' : 'Customize'}
          </button>
        </div>

        {showColorPicker && (
          <div className={`p-4 border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            {/* Color Presets */}
            <div className="mb-4">
              <h4 className={`text-xs font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Quick Presets
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {colorPresets.map((preset) => {
                  const isSelected = selectedPreset === preset.name || 
                    (primaryColor === preset.primary && secondaryColor === preset.secondary)
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      data-testid={`color-preset-${preset.name.toLowerCase()}`}
                      onClick={() => handleColorPreset(preset.primary, preset.secondary, preset.name)}
                      className={`relative p-2 sm:p-2.5 border text-xs font-medium transition-colors min-h-[60px] flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? isDarkMode
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-indigo-500 bg-indigo-50'
                          : isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500"
                          style={{ backgroundColor: preset.primary }}
                        ></div>
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500"
                          style={{ backgroundColor: preset.secondary }}
                        ></div>
                      </div>
                      {preset.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Color Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => onPrimaryColorChange(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => onPrimaryColorChange(e.target.value)}
                    className={`flex-1 px-2 py-1.5 text-xs border focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-800 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="#5C2D91"
                  />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => onSecondaryColorChange(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => onSecondaryColorChange(e.target.value)}
                    className={`flex-1 px-2 py-1.5 text-xs border focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-800 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4">
              <h4 className={`text-xs font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Preview
              </h4>
              <div className={`p-4 border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      P
                    </div>
                    <div 
                      className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      S
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Your brand colors
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Primary: {primaryColor} • Secondary: {secondaryColor}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}