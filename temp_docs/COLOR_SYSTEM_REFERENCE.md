# PrepToDo Color System Reference

## Overview
This document explains the complete color system applied to `index.css` based on the semantic token table. All colors are designed for:
- **Accessibility**: WCAG AA compliance with proper contrast ratios
- **Eye strain reduction**: Warm tones and avoiding pure black/white
- **Semantic clarity**: Each color serves a specific cognitive function

---

## 1. Background Colors (Canvas & Panels)

### Light Mode
| Variable | Hex | Usage | Rationale |
|----------|-----|-------|-----------|
| `--color-bg-primary-light` | `#FAFAF9` | App canvas background | Warm Stone reduces glare, mimics paper |
| `--color-bg-secondary-light` | `#FFFFFF` | Cards, modals, panels | Pure white elevates content from canvas |
| `--color-bg-tertiary-light` | `#F5F5F4` | Subtle elevation layers | Stone 100 for depth hierarchy |

### Dark Mode
| Variable | Hex | Usage | Rationale |
|----------|-----|-------|-----------|
| `--color-bg-primary-dark` | `#0A0F0D` | App canvas background | Dark Forest prevents OLED smear |
| `--color-bg-secondary-dark` | `#131C18` | Cards, modals, panels | Charcoal Green elevates from canvas |
| `--color-bg-tertiary-dark` | `#1C2822` | Subtle elevation layers | Derived darker green for depth |

**Design Note**: The progression from primary → secondary → tertiary creates a 3-level elevation system for Z-axis hierarchy.

---

## 2. Text Colors (Readability)

### Light Mode
| Variable | Hex | Usage | Rationale |
|----------|-----|-------|-----------|
| `--color-text-primary-light` | `#1C1917` | Main body text | Stone 900 - avoids pure black to reduce halation |
| `--color-text-secondary-light` | `#57534E` | Muted text, rationales, metadata | Stone 600 - softer for secondary info |
| `--color-text-muted-light` | `#78716C` | Tertiary text, placeholders | Stone 500 - most subtle |

### Dark Mode
| Variable | Hex | Usage | Rationale |
|----------|-----|-------|-----------|
| `--color-text-primary-dark` | `#ECFDF5` | Main body text | Mint White - avoids pure white |
| `--color-text-secondary-dark` | `#A7F3D0` | Muted text, rationales | Emerald 200 - softer for secondary info |
| `--color-text-muted-dark` | `#6EE7B7` | Tertiary text, placeholders | Emerald 300 - most subtle |

**Contrast Ratios**:
- Primary text: 12:1+ (AAA compliant)
- Secondary text: 7:1+ (AA compliant)

---

## 3. Brand Colors (Identity & Actions)

### Primary Teal (PrepToDo Brand)
| Variable | Hex | Usage | Context |
|----------|-----|-------|---------|
| `--color-brand-primary-light` | `#0F5F53` | Primary buttons, active states, headers | Trust & Focus |
| `--color-brand-primary-hover-light` | `#0A4A40` | Hover state for primary actions | Derived darker |
| `--color-brand-secondary-light` | `#14B8A6` | Secondary actions, links | Teal 500 (derived) |
| `--color-brand-accent-light` | `#14E38A` | Progress bars, streaks, success | Neon Mint |

### Dark Mode
| Variable | Hex | Usage | Context |
|----------|-----|-------|---------|
| `--color-brand-primary-dark` | `#10B981` | Primary actions | Emerald 500 for visibility |
| `--color-brand-primary-hover-dark` | `#34D399` | Hover state | Emerald 400 |
| `--color-brand-secondary-dark` | `#059669` | Secondary actions | Emerald 600 (derived) |
| `--color-brand-accent-dark` | `#34D399` | Progress, streaks | Emerald 400 |

**Color Derivation Strategy**:
- **Primary** (`#0F5F53`) is the source truth
- **Hover** states are 15-20% darker for light mode, lighter for dark mode
- **Secondary** variants use the same hue family (Teal/Emerald)
- **Accent** uses complementary mint green for "success" semantic

---

## 4. Semantic Colors (Status & Feedback)

| Purpose | Light Mode | Dark Mode | Usage |
|---------|------------|-----------|-------|
| Success | `#10B981` (Emerald 500) | Same | Correct answers, achievements |
| Warning | `#F59E0B` (Amber 500) | Same | Warnings, caution states |
| Error | `#DC2626` (Red 600) | `#F87171` (Red 400) | Incorrect answers, errors |
| Info | `#3B82F6` (Blue 500) | Same | Informational messages |

---

## 5. Knowledge Graph Colors (AI Reasoning)

These colors distinguish different node types in the AI knowledge graph visualization:

| Node Type | Light Mode | Dark Mode | Usage |
|-----------|------------|-----------|-------|
| **Concepts** | `#2563EB` (Blue 600) | `#60A5FA` (Blue 400) | Theory concepts, definitions |
| **Strategies** | `#7C3AED` (Violet 600) | `#A78BFA` (Violet 400) | Problem-solving approaches |

**Future Extension**: Additional node types (ErrorPattern, Skill, etc.) can use:
- Orange family for error patterns
- Green family for skills
- Yellow family for heuristics

---

## 6. Border Colors (Subtle Structure)

### Light Mode
| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-border-light` | `#E7E5E4` | Standard borders (Stone 200) |
| `--color-border-lighter` | `#F5F5F4` | Lighter borders (Stone 100) |

### Dark Mode
| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-border-dark` | `#292524` | Standard borders (Stone 800) |
| `--color-border-darker` | `#44403C` | Darker borders (Stone 700) |

**Philosophy**: Borders should be barely visible, serving as gentle guides rather than harsh divisions.

---

## 7. Usage Guidelines

### Do's ✅
- Use `--color-brand-primary-*` for all primary CTAs (buttons, active states)
- Use `--color-brand-accent-*` for progress indicators and success states
- Use `--color-graph-*` colors only for knowledge graph visualizations
- Use semantic colors (`success`, `error`, `warning`) for feedback states
- Always test contrast ratios (use WebAIM or similar tools)

### Don'ts ❌
- Don't use pure black (`#000000`) or pure white (`#FFFFFF`) for text
- Don't mix graph colors with brand colors for buttons
- Don't use brand colors for error states (use semantic `--color-error`)
- Don't create new color variables without documenting them here

---

## 8. Accessibility Compliance

All color combinations in this system meet:
- **WCAG AA**: Minimum 4.5:1 contrast for normal text, 3:1 for large text
- **WCAG AAA**: Many combinations exceed 7:1 for enhanced readability

### High-Contrast Mode Support
The system includes explicit dark mode variants rather than relying on CSS filters, ensuring predictable rendering across devices.

---

## 9. Implementation Notes

### Tailwind CSS Integration
The colors are defined in the `@theme` directive and can be used as:
```css
/* Backgrounds */
.bg-bg-primary-light
.bg-bg-secondary-dark

/* Text */
.text-text-primary-light
.text-text-secondary-dark

/* Borders */
.border-border-light
.border-brand-primary-light
```

### Dark Mode Switching
Use Tailwind's `dark:` variant:
```html
<div class="bg-bg-primary-light dark:bg-bg-primary-dark">
  <p class="text-text-primary-light dark:text-text-primary-dark">
    Content here
  </p>
</div>
```

---

## 10. Color Psychology & Rationale

| Color Family | Emotional Impact | Usage in PrepToDo |
|--------------|------------------|-------------------|
| **Teal** (`#0F5F53`) | Trust, clarity, focus | Primary brand, CTAs |
| **Mint** (`#14E38A`) | Growth, success, energy | Progress, achievements |
| **Stone** (`#FAFAF9`) | Warmth, neutrality, calm | Backgrounds, reducing glare |
| **Emerald** (dark mode) | Vitality, balance | Ensures visibility in dark |
| **Blue** (graphs) | Logic, analysis | Knowledge concepts |
| **Violet** (graphs) | Creativity, strategy | Problem-solving approaches |

---

## 11. Future Considerations

### Potential Additions
1. **User Customization**: Allow users to choose between "Focus" (current), "High Contrast", and "Warm Night" themes
2. **Colorblind Modes**: Test with Deuteranopia and Protanopia simulators
3. **Reading Mode**: Ultra-minimal variant with sepia tones for extended reading sessions
4. **Celebration Colors**: Gold/amber for streaks and milestones (already partially supported)

### Performance Notes
- All colors are static CSS variables (no runtime computation)
- Dark mode switching is instant (no color calculations needed)
- Total color palette: ~30 semantic tokens (manageable, not bloated)

---

## Summary of Changes from Original

| Aspect | Before | After | Reason |
|--------|--------|-------|--------|
| Canvas BG (light) | `#e6fbf3` (Mint) | `#FAFAF9` (Stone) | Warmer, less color cast |
| Canvas BG (dark) | `#121212` (Neutral) | `#0A0F0D` (Forest) | OLED-optimized, thematic |
| Primary Brand | `#0d7377` (Generic Teal) | `#0F5F53` (PrepToDo Teal) | Brand-specific |
| Success Accent | `#d4a039` (Amber) | `#14E38A` (Mint) | Matches "growth" theme |
| Text (light) | `#1d2a30` (Slate Blue) | `#1C1917` (Stone) | Neutral, less color bias |
| Added | N/A | Knowledge Graph colors | Supports AI visualization |

---

**Last Updated**: January 2026  
**Color System Version**: 2.0  
**Maintained by**: PrepToDo Design Team
