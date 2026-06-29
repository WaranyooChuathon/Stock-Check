---
name: StockCheck
description: Calm, precise serialized-asset tracker — a field instrument for verify/audit on a tablet.
colors:
  instrument-blue: "#2563eb"
  instrument-blue-deep: "#1d4ed8"
  instrument-blue-light: "#60a5fa"
  verified-green: "#16a34a"
  verified-green-ink: "#15803d"
  discrepancy-red: "#dc2626"
  discrepancy-red-ink: "#b91c1c"
  signal-amber: "#f59e0b"
  ink: "#111827"
  ink-soft: "#374151"
  muted: "#6b7280"
  surface: "#ffffff"
  surface-sunken: "#f9fafb"
  surface-raised: "#f3f4f6"
  border: "#e5e7eb"
  border-strong: "#d1d5db"
  bg-dark: "#030712"
  surface-dark: "#111827"
  surface-dark-raised: "#1f2937"
  border-dark: "#374151"
  ink-dark: "#f3f4f6"
typography:
  page-title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.instrument-blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.instrument-blue-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  badge-verified:
    backgroundColor: "#f0fdf4"
    textColor: "{colors.verified-green-ink}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-discrepancy:
    backgroundColor: "#fef2f2"
    textColor: "{colors.discrepancy-red-ink}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-neutral:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: StockCheck

## 1. Overview

**Creative North Star: "The Field Instrument"**

StockCheck is a precise handheld instrument, not a dashboard to admire. Picture a calibrated tool
held in one hand on a stockroom floor: the reading is unambiguous, the controls are exactly where
the thumb expects them, and nothing on the face is there for decoration. Every surface earns its
place by serving the verify/audit task. The system is **calm, precise, and trustworthy** — quiet by
default so that the one thing that matters (is this item verified? does it have a discrepancy?) is
the loudest thing on screen.

Color is rationed. A confident **Instrument Blue** carries primary action and focus; **green** and
**red** are reserved strictly for verify state; everything else is a cool neutral gray layered
tonally for depth. The interface is flat at rest and leans on borders and surface tints rather than
shadows. Typography is a single well-tuned sans (Geist) at a fixed rem scale — no fluid display
type, no font pairing, because product UI rewards consistency over drama.

This system explicitly **rejects enterprise-bloat (SAP-style cramped gray density, deeply nested
menus, tiny controls, modal-on-modal)** and equally rejects the **generic AI-SaaS template look**
(cream/sand body, gradient text, hero-metric blocks, identical icon-card grids, an uppercase tracked
eyebrow over every section). It should read as shipped production software a real checker could use
without training.

**Key Characteristics:**
- Calm density: show what the task needs, nothing more.
- One confident accent (Instrument Blue) for action + focus; color otherwise means *state*.
- Flat-by-default; depth via tonal gray layering and 1px borders, not shadows.
- Field-first: touch targets ≥44px, glanceable status, full light/dark parity.
- Tactile & confident controls — clear hover/active/focus feedback, never flashy.

## 2. Colors

A cool, neutral gray foundation with a single confident blue accent and a tight red/green state
vocabulary. Color is information, not ornament.

### Primary
- **Instrument Blue** (#2563eb): Primary actions (the one filled button on a screen), the current
  selection, and the focus ring (`ring` at ~40% opacity). Hover deepens to **Instrument Blue Deep**
  (#1d4ed8); on dark surfaces, links/icons lift to **Instrument Blue Light** (#60a5fa) for contrast.

### Secondary
- **Verified Green** (#16a34a, ink #15803d): Used *only* for the `verified` state — badges, success
  confirmations. Paired with a pale `#f0fdf4` fill (light) / `green-950/40` (dark).
- **Discrepancy Red** (#dc2626, ink #b91c1c): Used *only* for the `discrepancy` state and
  destructive actions (delete). Pale `#fef2f2` fill (light) / `red-950/40` (dark); destructive focus
  ring is red.
- **Signal Amber** (#f59e0b): The "Live Demo" banner and soft warnings. Deliberately rare; it marks
  the demo chrome, not product content.

### Neutral
- **Ink** (#111827 / dark #f3f4f6): Primary text. **Ink Soft** (#374151): secondary text, labels.
  **Muted** (#6b7280): tertiary/placeholder text — never lighter than this for body, to hold 4.5:1.
- **Surface** (#ffffff / dark #111827): The content plane. **Surface Sunken** (#f9fafb) and
  **Surface Raised** (#f3f4f6) layer panels and toolbars; dark mode uses #030712 (page) → #111827
  (surface) → #1f2937 (raised).
- **Border** (#e5e7eb / dark #374151) and **Border Strong** (#d1d5db): 1px hairlines that do the
  structural work shadows would in a heavier system.

### Named Rules
**The State-Color Rule.** Green and red mean exactly one thing each: `verified` and `discrepancy`.
They are forbidden as decoration, emphasis, or category color. If something is green, it passed.
**The One Accent Rule.** Instrument Blue covers ≤10% of a screen — one primary button, the active
nav item, the focus ring. A second blue button on the same screen means one of them is wrong.

## 3. Typography

**Body / UI Font:** Geist (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Mono Font:** Geist Mono (for serial numbers, asset codes, MAC addresses, IDs)

**Character:** One humanist-geometric sans across the whole product — headings, labels, buttons,
data. No display/body pairing; product UI is calmer and more consistent with a single tuned family.
Serial numbers and machine codes shift to Geist Mono so digits align and `0/O`, `1/l` stay legible.

### Hierarchy
- **Page Title** (600, 1.5rem/24px, -0.01em): One per screen — "สวัสดี admin", page headers.
- **Headline** (600, 1.25rem/20px): Section headings, card cluster titles.
- **Title** (600, 1.125rem/18px): Card titles, dialog titles.
- **Body** (400, 1rem/16px, line-height 1.5): Default reading text; cap prose at 65–75ch.
- **Label** (500, 0.875rem/14px): Form labels, button text, secondary metadata.
- **Caption** (500, 0.75rem/12px): Badge text, table sub-labels, helper hints.
- **Mono** (400, 0.875rem/14px): Serial numbers, codes, IDs — Geist Mono, never for prose.

### Named Rules
**The Fixed-Scale Rule.** Sizes are fixed rem, never `clamp()`/fluid. A heading must not shrink in a
sidebar or inside the tablet frame. **The Mono-for-Machines Rule.** Anything a machine assigned (S/N,
asset tag, MAC, ID) is set in Geist Mono; anything a human wrote is set in Geist Sans.

## 4. Elevation

Flat by default. Depth comes from **tonal layering** (page → surface → raised gray steps) and 1px
borders, not from shadows. The only resting shadow is a whisper-light `shadow-sm` on cards and
inputs to lift them a hair off the page. The heavy `shadow-2xl` is reserved exclusively for the
device-frame bezel in showcase mode — a deliberate, single dramatic exception that reads as physical
hardware.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): Resting elevation for cards/inputs.
- **Device bezel** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`): Showcase tablet shell only.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. If you reach for a shadow to separate two
panels, use a border or a tonal step instead. Shadow is for *physical* objects (the bezel) and
nothing else.

## 5. Components

Components feel **tactile and confident**: clear, satisfying state feedback (hover, focus, active),
a single consistent shape language, never decorative. Same button shape, same field vocabulary,
screen to screen.

### Buttons
- **Shape:** Gently rounded (`rounded-lg`, 8px), 44px tall (touch-safe).
- **Primary:** Instrument Blue (#2563eb) fill, white text, `0 16px` padding; hover deepens to
  #1d4ed8. One per screen.
- **Secondary / Ghost:** Surface or transparent with a 1px Border (#e5e7eb / dark #374151), Ink Soft
  text; hover tints the surface one tonal step.
- **Destructive:** Discrepancy Red (#dc2626) for delete; red focus ring.
- **Focus:** Always a visible 2px ring in the action's hue at ~40% opacity (`ring-blue-600/40`).
  Never remove focus outlines.

### Chips / Badges
- **Style:** Pill (`rounded-full`), 1px border, `2px 8px` padding, Caption text (12px, 500).
- **State variants:** `verified` (green fill/ink/border), `discrepancy` (red), `unverified`/neutral
  (gray). Status badges always pair color with a text label — never color alone.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px); larger panels/auth cards `rounded-2xl` (16px).
- **Background:** Surface (#fff / dark #111827).
- **Shadow Strategy:** `shadow-sm` only (see Elevation). Separation primarily via 1px border.
- **Border:** 1px Border (#e5e7eb / dark #1f2937–#374151).
- **Internal Padding:** 24px (`lg`). Never nest a card inside a card.

### Inputs / Fields
- **Style:** 1px Border (#d1d5db / dark #374151), Surface fill, `rounded-lg`, 44px tall.
- **Focus:** Border shifts to Instrument Blue with a matching ring; no glow.
- **Placeholder:** Muted (#6b7280) — held at 4.5:1, never lighter.

### Navigation
- **Style:** Top bar with the "StockCheck" wordmark (Title weight), user role, theme toggle, and
  logout. Mobile-first: controls stay reachable; menus are flat, never deeply nested.

### Signature Component — Device Frame (Showcase)
A tablet bezel (`rounded-[2.25rem]`, `shadow-2xl`, dark shell) wrapping a same-origin iframe of the
live app, with a preset switcher (8.8" / 11" / web) and orientation toggle. It frames the product as
the field instrument it is — the one place the system is allowed to look like physical hardware.

## 6. Do's and Don'ts

### Do:
- **Do** keep Instrument Blue (#2563eb) to ≤10% of a screen — one primary action, the active nav
  item, the focus ring.
- **Do** reserve green/red strictly for `verified` / `discrepancy` state, always paired with a text
  label for color-vision safety.
- **Do** separate panels with 1px borders and tonal gray steps; stay flat (only `shadow-sm` at rest).
- **Do** keep every touch target ≥44px and every interactive element with visible hover + focus +
  active states.
- **Do** set serial numbers, asset codes, and IDs in Geist Mono.
- **Do** maintain full light/dark parity and ≥4.5:1 body contrast (≥3:1 large), placeholders included.

### Don't:
- **Don't** drift toward **enterprise-bloat (SAP-style)**: no cramped gray density, deeply nested
  menus, sub-44px controls, or modal-on-modal. Exhaust inline/progressive alternatives before a modal.
- **Don't** adopt the **generic AI-SaaS template** look: no cream/sand body background, no gradient
  text (`background-clip: text`), no hero-metric block, no identical icon-card grids, no uppercase
  tracked eyebrow over every section.
- **Don't** use `border-left`/`border-right` >1px as a colored accent stripe on cards or alerts; use
  full borders, background tints, or a leading icon instead.
- **Don't** use glassmorphism as decoration, or shadows to fake separation (use borders/tonal steps).
- **Don't** use `clamp()`/fluid type in the product UI, or pair a second font family with Geist.
- **Don't** let body text fall back to Arial — wire `--font-geist-sans` onto `body` in
  `globals.css` so the loaded brand font actually renders (current known gap).
- **Don't** convey status by color alone, and never remove focus outlines.
