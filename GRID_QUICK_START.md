# Quick Start: Cal.com Grid System

## ✅ What's Been Added

1. **New CSS File:** `src/app/grid-system.css` (isolated, safe)
2. **Import Added:** Automatically imported in `globals.css`
3. **All classes prefixed with `cal-`** to avoid conflicts

## 🚀 Quick Usage

### Basic Structure
```tsx
<section className="cal-section">
  <div className="cal-container">
    <div className="cal-grid">
      <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
        Content here
      </div>
    </div>
  </div>
</section>
```

### Key Classes

| Class | Purpose |
|------|---------|
| `.cal-container` | Max-width centered wrapper (1280px) |
| `.cal-section` | Vertical spacing (80px top/bottom) |
| `.cal-grid` | 12-column grid container |
| `.cal-col-span-x` | Column width (1-12) |

### Responsive Breakpoints

- **Mobile (default):** Full width
- **Tablet (640px+):** Use `sm:cal-col-span-x`
- **Desktop (1024px+):** Use `lg:cal-col-span-x`

## 📝 Example: Add Grid to Existing Section

### Your Current Code (Unchanged):
```tsx
<section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
  <div className="max-w-7xl mx-auto">
    {/* Your existing content */}
  </div>
</section>
```

### Option 1: Keep Existing, Add Grid Inside
```tsx
<section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
  <div className="max-w-7xl mx-auto">
    {/* Use cal-grid inside your existing container */}
    <div className="cal-grid">
      <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
        Content
      </div>
    </div>
  </div>
</section>
```

### Option 2: Replace with Cal.com Classes (When Ready)
```tsx
<section className="cal-section bg-white">
  <div className="cal-container">
    <div className="cal-grid">
      <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
        Content
      </div>
    </div>
  </div>
</section>
```

## 🎯 Common Patterns

### 3 Equal Columns
```tsx
<div className="cal-grid">
  <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">1</div>
  <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">2</div>
  <div className="cal-col-span-12 lg:cal-col-span-4">3</div>
</div>
```

### 2 Columns
```tsx
<div className="cal-grid">
  <div className="cal-col-span-12 lg:cal-col-span-6">Left</div>
  <div className="cal-col-span-12 lg:cal-col-span-6">Right</div>
</div>
```

### Main + Sidebar
```tsx
<div className="cal-grid">
  <div className="cal-col-span-12 lg:cal-col-span-8">Main</div>
  <div className="cal-col-span-12 lg:cal-col-span-4">Sidebar</div>
</div>
```

## 🔍 Debug Mode (Optional)

To see grid columns during development:

```tsx
<div className="cal-grid-debug">
  <div className="cal-grid cal-grid-overlay">
    {/* Your grid content */}
  </div>
</div>
```

## ⚠️ Important Notes

- ✅ **Safe to use:** All classes prefixed with `cal-`
- ✅ **Non-breaking:** Won't affect existing code
- ✅ **Optional:** Use only where you need it
- ✅ **Isolated:** Separate CSS file

## 📚 Full Documentation

See `GRID_SYSTEM_USAGE.md` for complete guide.

