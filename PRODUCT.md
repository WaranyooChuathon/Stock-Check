# Product

## Register

product

## Users

**Primary — field stock-checkers (role: `staff`).** Warehouse / on-site staff verifying physical
assets one item at a time on a **tablet or iPad held in hand**, often in a stockroom with uneven
lighting and frequent interruptions. Their job: match each item's serial number against the record,
run the device/equipment checklist, and flag anything wrong (S/N mismatch, missing checklist item)
so nothing slips. They are Thai-speaking and in a repetitive, attention-heavy task — they need to
glance, confirm, and move on.

**Secondary — admins.** Manage the item catalog, bulk-import from Excel/CSV, manage users, and
review the full change log / audit trail. More desk-bound, but the same surface and vocabulary.

Context of use: **mobile/tablet-first**, one-handed, in the field. Desktop/web is a supported but
secondary surface.

## Product Purpose

**StockCheck** is a generic **serialized-asset tracker** — one row = one physical item — built
around a **verify / audit workflow**. Items carry a stable core (serial number, status, verify
state, category) plus flexible category-specific attributes. The core value is a **trustworthy,
auditable count**: every mutation is logged, discrepancies are surfaced explicitly, and the state
of each item is unambiguous.

It is also a **company-safe portfolio demo** adapted from a real internal tool: all data is
synthetic, and it runs zero-config in an in-memory demo mode as well as against real PostgreSQL.
Success = a viewer trusts it as production software *and* a real checker could pick it up on a
tablet and work without training.

## Brand Personality

**Calm · precise · trustworthy.** The voice is clear and factual (Thai UI), no marketing fluff,
no clever labels for standard actions. The interface should feel quiet and certain — the emotional
goal is **confidence**: the checker believes the count is accurate and the auditor believes the
trail is complete. Delight is reserved for small confirming moments (a clean verify, a resolved
discrepancy), never decoration.

## Anti-references

- **Enterprise-bloat / legacy ERP (SAP-like)** — the explicit "do not become this": cramped gray
  density, deeply nested menus, tiny dense controls, modal-on-modal, screens that need a manual.
- **Generic AI-SaaS template** — cream/sand body, gradient text, the hero-metric block, identical
  icon-card grids, an uppercase tracked eyebrow over every section. As a portfolio piece it must
  not read as "AI generated a dashboard."

## Design Principles

1. **The tool disappears into the task.** Earned familiarity over novelty — standard affordances
   for standard actions, consistent component vocabulary screen to screen. The checker thinks about
   the asset, not the app.
2. **Trust through precision.** Status (verified / unverified, discrepancy, deleted) is legible at a
   glance and never ambiguous. Auditability is a visible feature, not a hidden log.
3. **Field-first, one-handed.** Designed for a tablet in a stockroom: glanceable, touch-friendly,
   resilient to interruption. Density serves the task without becoming the enemy (anti-SAP).
4. **Calm density.** Show exactly what the task needs; restraint over decoration. Quiet by default,
   color reserved for state and primary action.
5. **Honest production software.** It's a working tool with synthetic data — design reads as shipped
   product, not a mockup or a marketing page.

## Accessibility & Inclusion

Target **WCAG 2.2 AA**. Body text contrast ≥ 4.5:1 (large text ≥ 3:1), placeholders included;
visible focus states; full keyboard operation; touch targets ≥ 44px; **light/dark parity** on every
surface; Thai-script legibility at body sizes. Respect `prefers-reduced-motion` for any added
motion. Status must never rely on color alone (pair with icon/label) for color-vision safety.
