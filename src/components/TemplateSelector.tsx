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
    name: 'Fast Invoice',
    description: 'Quick and reliable',
    icon: FileText,
    defaultPrimary: '#5C2D91',
    defaultSecondary: '#8B5CF6'
  },
  {
    id: 2,
    name: 'Modern',
    description: 'Sleek and minimal',
    icon: Layout,
    defaultPrimary: '#7C3AED',
    defaultSecondary: '#A855F7'
  },
  {
    id: 3,
    name: 'Creative',
    description: 'Bold and dynamic',
    icon: PenTool,
    defaultPrimary: '#8B5CF6',
    defaultSecondary: '#F59E0B'
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
  { name: 'Teal', primary: '#0D9488', secondary: '#14B8A6' }
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

  const handleTemplateSelect = (templateId: number) => {
    onTemplateSelect(templateId)
    const template = templatePreviews.find(t => t.id === templateId)
    if (template) {
      onPrimaryColorChange(template.defaultPrimary)
      onSecondaryColorChange(template.defaultSecondary)
    }
  }

  const handleColorPreset = (primary: string, secondary: string) => {
    onPrimaryColorChange(primary)
    onSecondaryColorChange(secondary)
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
                onClick={() => handleTemplateSelect(template.id)}
                className={`relative cursor-pointer rounded-lg border p-3 transition-all duration-200 ${
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
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm bg-indigo-600"
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
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
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
          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            {/* Color Presets */}
            <div className="mb-4">
              <h4 className={`text-xs font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Quick Presets
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleColorPreset(preset.primary, preset.secondary)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: preset.primary }}
                      ></div>
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: preset.secondary }}
                      ></div>
                    </div>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Inputs */}
            <div className="grid grid-cols-2 gap-3">
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
                    className={`flex-1 px-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
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
                    className={`flex-1 px-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
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
            <div className="mt-3">
              <h4 className={`text-xs font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Preview
              </h4>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  B
                </div>
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: secondaryColor }}
                >
                  S
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Your brand colors
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}