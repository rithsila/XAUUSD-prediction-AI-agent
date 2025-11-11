# Liquid Class Header Animations — Implementation Plan and Guide

This document provides a comprehensive plan to update all header animations across the application to approximate the “Liquid” glass transition effects seen in modern iOS motion design. It covers analysis, style guidelines, implementation details, accessibility, cross‑browser compatibility, testing protocols, customization options, and maintenance guidelines.

Note: As proprietary iOS 26.1 motion parameters are not publicly documented, the values below are carefully derived from Apple’s Human Interface Guidelines and observed motion behaviors in recent iOS versions. They are tuned for our existing Liquid Glass aesthetic and can be further refined during validation.

---

## 1) Analysis of the Liquid Glass Transition Characteristics

- Timing curves and durations
  - Standard ease for routine UI changes: cubic‑bezier(0.2, 0, 0, 1)
  - Emphasized ease for attention‑worthy transitions (subtle overshoot): cubic‑bezier(0.2, 0.8, 0.2, 1)
  - Durations: 150–250 ms for minor headers; 450–550 ms for global navigation header entrance
  - Rationale: Shorter durations improve perceived responsiveness; longer emphasized timing helps liquid/viscous feel

- Visual properties
  - Opacity: Quick fade‑in to 1.0 by ~50% of animation for crispness
  - Scale: Slight compression on mount (≈0.985) with gentle overshoot (≈1.01) before settling to 1.0
  - Blur: Backdrop blur starts higher (≈18px) and settles to base blur (≈12px), creating a “condensing” glass feel
  - Saturation: Increased saturation at start to enhance glass depth (≈1.45 → 1.3)

- Physics‑based motion behaviors
  - Scroll‑responsive: As the user scrolls down, header compresses slightly and glass deepens (more blur/saturation)
  - Velocity awareness (lightweight): Throttle using rAF and clamp progress to avoid jitter; minimal computational overhead
  - Prefer‑reduced‑motion respected: Motion is disabled when the system preference is on

---

## 2) Style Guide for Header Animations

Goals:
- Maintain consistency with the Liquid Glass aesthetic and existing design tokens
- Ensure smooth page‑to‑page transitions without jarring artifacts
- Preserve system performance with composited transforms and typed custom properties

Design tokens (CSS variables):
- Durations
  - --motion-duration-fast: 150ms
  - --motion-duration-normal: 250ms
  - --motion-duration-slow: 550ms
- Easings
  - --motion-ease-standard: cubic‑bezier(0.2, 0, 0, 1)
  - --motion-ease-emphasized: cubic‑bezier(0.2, 0.8, 0.2, 1)
- Liquid variables (typed via @property)
  - --liquid-blur: <length> (default 12px)
  - --liquid-sat: <number> (default 1.3)
  - --liquid-scale: <number> (default 1)

Application rules:
- Global navigation header (header.glass-nav)
  - Entrance: liquid-header-enter with emphasized easing and slow duration
  - Sticky behavior: subtle compression as scroll progresses (scale down up to ~2%)
  - Backdrop: animate blur/saturation via CSS variables where supported; provide fallback without backdrop filters
- UI headers (CardHeader, DialogHeader, SheetHeader, DrawerHeader, SidebarHeader, etc.)
  - Entrance: same keyframe but normal duration; scale overshoot toned down
  - Use attribute selector [data-slot$="header"] to avoid touching component code where possible
- Accessibility
  - Respect prefers-reduced-motion (provided globally in index.css)
  - Maintain strong focus rings and predictable keyboard flows

Performance guidelines:
- Only animate opacity, transform, and typed custom properties (backdrop-filter via CSS variables) to stay on the compositor
- Throttle scroll updates with requestAnimationFrame and passive listeners
- Avoid layout-affecting CSS (e.g., height changes) during motion

---

## 3) Implementation Details

Code changes included in this plan:
- CSS tokens and keyframes (client/src/index.css)
  - Added motion tokens and typed custom properties (@property)
  - Implemented keyframes liquid-header-enter to animate opacity, scale, blur, and saturation
  - Applied animations to header.glass-nav and [data-slot$="header"]
  - Provided backdrop-filter support and safe fallback via @supports

- Physics hook (client/src/hooks/useLiquidHeaderMotion.ts)
  - Updates --liquid-blur, --liquid-sat, and --liquid-scale based on scroll progress
  - Lightweight, respects prefers-reduced-motion
  - Uses passive scroll listener and requestAnimationFrame to keep main thread smooth

- AppHeader integration (client/src/components/AppHeader.tsx)
  - Attached the hook to the header element via ref
  - Ensures the global header benefits from dynamic glass depth and compression

Cross‑browser compatibility:
- Backdrop filters: Guarded by @supports; fallback to adjusted background transparency via color-mix when unsupported
- Typed custom properties: Where unsupported, variables gracefully behave as constants and the entrance still animates opacity/transform
- Prefixes: Include -webkit-backdrop-filter for Safari/WebKit

Responsive design considerations:
- Container paddings and header height already responsive in index.css
- Motion tuning remains constant across breakpoints to keep behavior predictable

Accessibility compliance:
- Global prefers-reduced-motion rules disable transitions and animations when requested by the OS
- Focus rings supported via .focus-ring class and strong outline tokens

---

## 4) Testing Protocols

Visual regression testing:
- Tooling: Playwright recommended (can be added alongside Vitest)
- Scenarios:
  1) AppHeader mount in light/dark/AMOLED themes
  2) DialogHeader open/close; Drawer/Sheet reveal
  3) CardHeader render across key pages (Home, Sentiment, API Keys, Settings)
- Baselines: Capture screenshots at animation end‑states (after 600ms) to reduce flakiness

Performance benchmarking:
- Measurements: FPS (Chrome DevTools Performance), main thread time, style/layout thrashing
- Targets: Maintain >55 FPS during scroll on typical laptop; <3ms per frame in scripting during scroll
- Steps:
  - Record scroll from top to 400px; ensure composited transforms only
  - Verify no Forced Reflow warnings in Performance panel

User experience validation:
- A/B sessions with 5–10 internal users
- Checklist:
  - Header feels “liquid” without being distracting
  - Page‑to‑page transitions remain smooth; no jarring pops
  - Reduced motion preference yields a stable, no‑animation experience

---

## 5) Customization Options

Tokens (adjust in client/src/index.css):
- Motion: --motion-duration-*, --motion-ease-*
- Glass depth: --liquid-blur, --liquid-sat
- Scale behaviors: --liquid-scale (baseline)

Hook tuning (client/src/hooks/useLiquidHeaderMotion.ts):
- RANGE: Scroll distance to reach full effect (default 80px)
- MAX_EXTRA_BLUR: Additional blur applied during scroll (default 6px)
- MAX_SCALE_REDUCTION: Max compression (default 0.02)

Component coverage:
- The [data-slot$="header"] selector ensures CardHeader, DialogHeader, DrawerHeader, SheetHeader, SidebarHeader receive the entrance animation without modifying each component

---

## 6) Maintenance Guidelines

- Versioning:
  - Record changes to motion tokens and keyframes in CHANGELOG with rationale
  - Keep token names stable to avoid breaking inline references

- Compatibility:
  - Re‑verify @supports fallbacks across Chromium, WebKit, Firefox after browser updates
  - If backdrop filters regress in any target, temporarily reduce animations to opacity/transform only

- Monitoring:
  - Use DevTools’ Rendering tab (paint flashing) to ensure animations remain on compositor
  - Track performance budgets and refresh baselines after major UI changes

- Accessibility:
  - Periodically test prefers‑reduced‑motion and ensure new components respect global rules

---

## Rollout Checklist

- Confirm the dev server renders new animations across all pages
- Validate reduced‑motion behavior
- Run visual checks for headers in: Home, Sentiment, API Keys, Settings, Login
- Capture performance traces; document in /docs/DEPLOYMENT.md if any adjustments are needed

Questions or refinements: open an issue titled “Liquid Header Motion — Feedback” and attach screenshots/videos.