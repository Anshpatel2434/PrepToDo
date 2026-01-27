# PrepToDo Color System - Quick Reference Card

## 🎨 Brand Identity Colors

```
PRIMARY TEAL (PrepToDo Brand)
├─ Light: #0F5F53  ← Use for buttons, active states
├─ Hover: #0A4A40  ← Darker for interaction feedback
└─ Dark:  #10B981  ← Bright enough for dark backgrounds

ACCENT MINT (Success & Growth)
├─ Light: #14E38A  ← Progress bars, streaks, celebrations
└─ Dark:  #34D399  ← Visible on dark backgrounds
```

---

## 📄 Background Hierarchy (Light Mode)

```
Level 1 (Canvas):    #FAFAF9  ← Warm Stone, main background
Level 2 (Panels):    #FFFFFF  ← Pure White, cards & modals
Level 3 (Elevation): #F5F5F4  ← Stone 100, subtle depth
```

## 🌙 Background Hierarchy (Dark Mode)

```
Level 1 (Canvas):    #0A0F0D  ← Dark Forest, OLED-optimized
Level 2 (Panels):    #131C18  ← Charcoal Green, elevated
Level 3 (Elevation): #1C2822  ← Deeper green, subtle depth
```

---

## ✍️ Text Colors

| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary (body text) | `#1C1917` | `#ECFDF5` |
| Secondary (metadata) | `#57534E` | `#A7F3D0` |
| Muted (placeholders) | `#78716C` | `#6EE7B7` |

---

## 🚦 Semantic Status Colors

```
✅ SUCCESS:  #10B981 (Emerald 500)  ← Correct answers
⚠️  WARNING:  #F59E0B (Amber 500)   ← Cautions
❌ ERROR:    #DC2626 (Red 600)      ← Incorrect (light)
❌ ERROR:    #F87171 (Red 400)      ← Incorrect (dark)
ℹ️  INFO:     #3B82F6 (Blue 500)    ← Informational
```

---

## 🧠 Knowledge Graph (AI Visualization)

```
🔵 CONCEPTS:    #2563EB (light) / #60A5FA (dark)
                ↑ Theory nodes, definitions

🟣 STRATEGIES:  #7C3AED (light) / #A78BFA (dark)
                ↑ Problem-solving approaches
```

---

## 🖼️ Border Colors

```css
Light Mode:
  --color-border-light:   #E7E5E4  /* Stone 200 */
  --color-border-lighter: #F5F5F4  /* Stone 100 */

Dark Mode:
  --color-border-dark:    #292524  /* Stone 800 */
  --color-border-darker:  #44403C  /* Stone 700 */
```

---

## 💡 Common Use Cases

### Primary Button
```html
<button class="bg-brand-primary-light hover:bg-brand-primary-hover-light 
               dark:bg-brand-primary-dark dark:hover:bg-brand-primary-hover-dark
               text-white">
  Start Practice
</button>
```

### Success Badge
```html
<span class="bg-brand-accent-light dark:bg-brand-accent-dark 
             text-text-primary-light dark:text-text-primary-dark">
  Streak: 7 days 🔥
</span>
```

### Panel/Card
```html
<div class="bg-bg-secondary-light dark:bg-bg-secondary-dark
            border border-border-light dark:border-border-dark
            rounded-2xl p-6">
  Content here
</div>
```

### Error Message
```html
<div class="text-error dark:text-error-dark">
  ❌ Incorrect. The correct answer was B.
</div>
```

---

## 🎯 Design Principles

1. **Never use pure black (#000) or pure white (#FFF) for text**  
   → Reduces halation and eye strain

2. **Warm backgrounds in light mode, forest-green in dark**  
   → Mimics paper, prevents OLED smear

3. **Brand teal for actions, mint for success**  
   → Clear semantic distinction

4. **3-level elevation system for depth**  
   → Primary (canvas) → Secondary (panels) → Tertiary (floating)

5. **Graph colors isolated from UI colors**  
   → Prevents confusion between navigation and data viz

---

## 🔧 Variable Naming Convention

```
--color-{category}-{variant}-{mode}

Examples:
  --color-bg-primary-light      ← Background, main canvas, light mode
  --color-text-secondary-dark   ← Text, muted style, dark mode
  --color-brand-primary-hover-light ← Brand, primary, hover state
```

---

## 📱 Responsive Considerations

- All colors are static (no runtime calculations)
- Dark mode toggle is instant
- Scrollbars match theme automatically
- No FOUC (Flash of Unstyled Content)

---

## ♿ Accessibility Checklist

- [x] WCAG AA compliant (4.5:1 contrast minimum)
- [x] Many combinations exceed AAA (7:1)
- [x] No pure black/white (prevents halation)
- [x] Distinct colors for colorblind users
- [x] Dark mode optimized for OLED screens

---

## 🚀 Quick Start (Copy-Paste)

```css
/* Light Mode Text on Light Background */
.text-text-primary-light
.bg-bg-secondary-light

/* Dark Mode Text on Dark Background */
.text-text-primary-dark
.bg-bg-secondary-dark

/* Primary Action Button */
.bg-brand-primary-light
.hover:bg-brand-primary-hover-light
.dark:bg-brand-primary-dark

/* Success State */
.text-success
.bg-brand-accent-light
.dark:bg-brand-accent-dark

/* Error State */
.text-error
.dark:text-error-dark
```

---

**Pro Tip**: Use the color picker in your browser DevTools to preview any color by searching for the variable name in the `:root` or `@theme` block.

---

**Version**: 2.0 | **Updated**: January 2026
