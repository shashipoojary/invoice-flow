# Cal.com-Style Grid System Usage Guide

## Overview
A safe, non-destructive 12-column grid system inspired by Cal.com's layout. All classes are prefixed with `cal-` to avoid conflicts with existing styles.

## Core Classes

### 1. Container (`.cal-container`)
Max-width centered wrapper with responsive padding.

```html
<div className="cal-container">
  <!-- Your content here -->
</div>
```

**Features:**
- Max-width: 1280px (centered)
- Responsive padding: 16px mobile → 24px tablet → 32px desktop

### 2. Section (`.cal-section`)
Beautiful vertical spacing for sections.

```html
<section className="cal-section">
  <div className="cal-container">
    <!-- Your content -->
  </div>
</section>
```

**Features:**
- Padding: 80px top/bottom (60px on mobile)
- Perfect for section separation

### 3. Grid (`.cal-grid`)
12-column grid container with responsive gutters.

```html
<div className="cal-grid">
  <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
    <!-- Column 1 -->
  </div>
  <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
    <!-- Column 2 -->
  </div>
  <div className="cal-col-span-12 lg:cal-col-span-4">
    <!-- Column 3 -->
  </div>
</div>
```

**Features:**
- 12 columns
- Responsive gutters: 16px mobile → 24px tablet → 32px desktop

### 4. Column Spans (`.cal-col-span-x`)
Column width utilities (1-12).

**Available classes:**
- `.cal-col-span-1` through `.cal-col-span-12`
- Responsive: `.sm:cal-col-span-x`, `.lg:cal-col-span-x`

## Example: Using Grid in Existing Section

### Before (Existing Code):
```tsx
<section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
  <div className="max-w-7xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Your content */}
    </div>
  </div>
</section>
```

### After (With Cal.com Grid - Non-Breaking):
```tsx
<section className="cal-section bg-white">
  <div className="cal-container">
    <div className="cal-grid">
      <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
        {/* Your content */}
      </div>
      <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
        {/* Your content */}
      </div>
      <div className="cal-col-span-12 lg:cal-col-span-4">
        {/* Your content */}
      </div>
    </div>
  </div>
</section>
```

## Complete Example: New Section

```tsx
<section className="cal-section bg-gray-50">
  <div className="cal-container">
    {/* Section Header */}
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Our Features
      </h2>
      <p className="text-lg text-gray-600">
        Everything you need to succeed
      </p>
    </div>

    {/* Grid Layout */}
    <div className="cal-grid">
      {/* Feature 1 */}
      <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Feature 1</h3>
          <p className="text-gray-600">Description here</p>
        </div>
      </div>

      {/* Feature 2 */}
      <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Feature 2</h3>
          <p className="text-gray-600">Description here</p>
        </div>
      </div>

      {/* Feature 3 */}
      <div className="cal-col-span-12 lg:cal-col-span-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Feature 3</h3>
          <p className="text-gray-600">Description here</p>
        </div>
      </div>
    </div>
  </div>
</section>
```

## Grid Overlay Debug Mode

To visualize the grid columns during development:

```tsx
<div className="cal-grid-debug">
  <div className="cal-grid cal-grid-overlay">
    {/* Your grid content */}
  </div>
</div>
```

**Note:** Grid overlay is disabled by default. Add `.cal-grid-debug` to enable.

## Responsive Breakpoints

- **Mobile (default):** Full width (12 columns)
- **Tablet (640px+):** Use `sm:cal-col-span-x`
- **Desktop (1024px+):** Use `lg:cal-col-span-x`

## Common Patterns

### 3-Column Layout
```tsx
<div className="cal-grid">
  <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">Col 1</div>
  <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">Col 2</div>
  <div className="cal-col-span-12 lg:cal-col-span-4">Col 3</div>
</div>
```

### 2-Column Layout
```tsx
<div className="cal-grid">
  <div className="cal-col-span-12 lg:cal-col-span-6">Left</div>
  <div className="cal-col-span-12 lg:cal-col-span-6">Right</div>
</div>
```

### Asymmetric Layout
```tsx
<div className="cal-grid">
  <div className="cal-col-span-12 lg:cal-col-span-8">Main (8 cols)</div>
  <div className="cal-col-span-12 lg:cal-col-span-4">Sidebar (4 cols)</div>
</div>
```

## Safety Features

✅ **Non-destructive:** All classes prefixed with `cal-`  
✅ **Isolated:** Separate CSS file, won't conflict  
✅ **Optional:** Use only where needed  
✅ **Backward compatible:** Existing code unchanged  

## Migration Tips

1. **Start small:** Use in one new section first
2. **Test thoroughly:** Check mobile, tablet, desktop
3. **Gradual adoption:** Replace sections one at a time
4. **Keep existing:** Don't change working code unless needed

