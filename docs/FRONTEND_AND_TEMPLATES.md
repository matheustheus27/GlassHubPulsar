# 🎨 Frontend & Design System - GlassHub Pulsar

This document describes the interface architecture of **GlassHub Pulsar**, detailing the **GlassHub Design System (Atomic Design)**, Glassmorphism visual rules, the specifications for the 4 resume themes, the **Symmetrical Link Balancing Algorithm**, and the internationalization dictionary (`uiTranslations.ts`).

---

## ⚛️ Atomic Design Pattern

The component structure inside [`../frontend/src/app/components`](../frontend/src/app/components) strictly follows the **Atomic Design** methodology:

```
frontend/src/app/components/
├── atoms/          # Indivisible primitives (Button, Input, Badge, GlassCard, Icon)
├── molecules/      # Simple combinations (FormField, SkillPillGroup, ContactItem)
├── organisms/      # Complex panels (GroupedNavbarHeader, ResumePreviewEngine, AdminCockpitView)
├── templates/      # Layout structures for 4 themes (GlassModern, GlassMinimalist, GlassExecutive, GlassCompact)
└── pages/          # Full page views (LandingPage, DashboardPage, SupportPage, AdminPage)
```

---

## 💎 Glassmorphism Design System: Tokens & Visual Rules

GlassHub enforces a cosmic Glassmorphism visual identity based on translucent vitreous surfaces, light refraction, and specular borders.

### 1. Blur & Translucency Tokens
- **Primary Glass Surface:**
  ```css
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  ```
- **Specular Reflection Border:**
  ```css
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-top: 1px solid rgba(255, 255, 255, 0.25); /* Top lighting effect */
  ```
- **Neon Glow Ring:**
  ```css
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37),
              0 0 20px 0 rgba(6, 182, 212, 0.25);
  ```

### 2. Accessibility & Contrast (WCAG AAA)
- All text overlays on frosted glass elements enforce a minimum contrast ratio of **7:1** against dark backgrounds (`#030712`).
- Text shadow drops ensure readability even if background blur fails in legacy browsers.

---

## 🎭 The 4 Resume Themes

The system supports real-time switching between 4 distinct themes without data loss or page reload:

| Theme | Visual Style | Recommended Usage | Key Features |
| :--- | :--- | :--- | :--- |
| **`GlassModern`** | Cyan neon, deep blur, two-column header. | Tech, Startups, Design, Innovation. | Luminous frosted cards, neon borders, pill badges for skills. |
| **`GlassMinimalist`** | Subtle blur, monochrome, editorial typography. | Law, Medicine, Executive Consulting. | Ultra-clean layout focused on high legibility without visual distraction. |
| **`GlassExecutive`** | Cobalt & gold specular highlights, timeline. | Corporate Directors, C-Level, Senior Management. | Strong experience timeline and prominent executive summary panel. |
| **`GlassCompact`** | Dense grid, high space efficiency, 2 columns. | Software Engineers, Data Scientists. | Maximizes A4 page density for candidates with extensive project listings. |

---

## 📐 Symmetrical Link Balancing Algorithm

### The "Orphan Widow Link" Problem
In traditional resumes, adding contact links (GitHub, LinkedIn, Email, Phone, Portfolio, X) often results in a single link sitting alone on a bottom row (e.g. 5 links arranged as `2 + 2 + 1`), creating an ugly visual imbalance.

### The Solution: Balanced Grid Matrix
GlassHub implements a pure mathematical function that computes the optimal matrix layout (`2x2`, `3x2`, `1x4`, `3x3`) based on the number of active links:

```typescript
// Symmetrical Link Balancing Logic
export function calculateSymmetricalLinkGrid(linkCount: number): { columns: number; layoutClass: string } {
  switch (linkCount) {
    case 1:
      return { columns: 1, layoutClass: 'grid-cols-1 justify-center' };
    case 2:
      return { columns: 2, layoutClass: 'grid-cols-2 justify-center gap-4' };
    case 3:
      return { columns: 3, layoutClass: 'grid-cols-3 justify-center gap-3' };
    case 4:
      return { columns: 2, layoutClass: 'grid-cols-2 justify-between gap-x-6 gap-y-2' }; // Perfect 2x2 Matrix
    case 5:
    case 6:
      return { columns: 3, layoutClass: 'grid-cols-3 justify-between gap-x-4 gap-y-2' }; // Balanced 3x2 Matrix
    default:
      return { columns: 4, layoutClass: 'grid-cols-4 justify-between gap-2' };
  }
}
```

#### Outcome:
- **4 Links:** Arranged as a **2x2 matrix** (2 rows by 2 columns).
- **5 or 6 Links:** Arranged as a **3x2 matrix** (2 rows by 3 columns).
- **Result:** Zero orphan links in both web live preview and Puppeteer PDF exports!

---

## 🌐 Interface i18n Dictionary (`uiTranslations.ts`)

UI internationalization (buttons, labels, error messages, and tooltips) is managed by a strongly-typed TypeScript dictionary [`uiTranslations.ts`](../frontend/src/app/i18n/uiTranslations.ts):

```typescript
export const uiTranslations = {
  'pt-BR': {
    welcomeTitle: 'Construa Currículos de Alto Impacto',
    exportPdfBtn: 'Exportar em PDF A4',
    atsScoreLabel: 'Pontuação de Compatibilidade ATS',
    themeModern: 'Glass Moderno',
  },
  'en-US': {
    welcomeTitle: 'Build High-Impact Resumes',
    exportPdfBtn: 'Export A4 PDF',
    atsScoreLabel: 'ATS Compatibility Score',
    themeModern: 'Glass Modern',
  }
} as const;
```

To switch languages, the custom `useTranslation()` React hook triggers a re-render updating only the active locale strings.
