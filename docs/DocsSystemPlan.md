# Integrated Documentation System — Feasibility, Architecture, and Implementation Plan

This plan evaluates and outlines a custom documentation system integrated into the existing application, aligned with the current style and branding.

## 1) Current Application Architecture — Integration Points

- Client
  - React + Vite (vite@7), Router: wouter
  - Design system: Tailwind CSS v4 tokens in client/src/index.css, Radix UI + shadcn-style components in client/src/components/ui/*
  - Theme provider (dark/light/AMOLED) via client/src/contexts/ThemeContext and CSS tokens
  - AppHeader (client/src/components/AppHeader.tsx) for global navigation
  - Command palette (cmdk) available (client/src/components/ui/command.tsx) for search UX

- Server
  - Express server, tRPC for API under /api/trpc
  - Dev: Vite middleware serving index.html; Prod: static files under dist/public
  - Auth via cookies and context; no SSR, primarily SPA

- Existing docs (Markdown)
  - docs/ImplementPlan.md, docs/login.md, docs/HeaderAnimations.md, etc.

- Integration points for docs
  - New routes: /docs and /docs/:slug (wouter)
  - AppHeader: add “Docs” link and optional search entry point
  - Styling: reuse Tailwind tokens and UI components for consistent branding
  - Content source: files in /docs; load and render Markdown/MDX in the app
  - Search: leverage cmdk for palette; index docs with Lunr/FlexSearch

## 2) Frameworks vs. Custom — Comparison

- VitePress (Vue)
  - Pros: fast, MD/MDX support, good defaults, built-in search (via Algolia DocSearch)
  - Cons: Vue-based; theming to match React app is harder; separate site by default; integrating navigation/branding consistently is non-trivial

- Docusaurus (React)
  - Pros: rich ecosystem, versioning, i18n, plugin architecture
  - Cons: separate build/site; theming may diverge from Tailwind + Radix stack; heavier runtime; duplication of header/theme; migration/hosting complexity

- Nextra (Next.js)
  - Pros: MDX-first, React components inside docs, good theme options
  - Cons: Requires Next.js; current app is Vite + Express; mixing frameworks complicates deployments and styling consistency

- Astro + Starlight
  - Pros: modern docs theme, MD content, fast builds
  - Cons: separate site; porting Tailwind tokens and Radix patterns takes effort; navigation integration is indirect

- Custom (recommended)
  - Pros: seamless integration into current UI/UX, single deployment, full control over branding and routing, reuses existing components and themes
  - Cons: you own versioning, search, and i18n implementation; modest engineering effort

Conclusion: A custom docs system built into the existing React/Vite app best meets the goals of unified branding, seamless navigation, and operational simplicity.

## 3) Key Requirements

- User experience
  - Consistent look-and-feel with current “Liquid Glass” aesthetic, dark/light/AMOLED themes
  - Discoverable navigation: global “Docs” in AppHeader, sidebar/toc, and command palette search
  - Mobile-friendly: responsive layouts; readable typography; accessible focus states

- Content organization
  - Hierarchical sections: Getting Started, Guides, Reference, Operations, Changelogs
  - Frontmatter for metadata: title, description, section, order, version, lang
  - Auto-generated sidebar and breadcrumbs from frontmatter

- Search functionality
  - Client-side index using Lunr.js or FlexSearch for low-latency search
  - Index built at dev start and production build; exposed as JSON
  - Integrate with cmdk palette and on-page search bar

- Versioning
  - Folder-based versions (e.g., docs/v1, docs/v2) with routing /docs/v1/:slug
  - Stable canonical routes (latest) and explicit pinned versions
  - Changelog and deprecation notes per version

- Multi-language
  - Optional: docs/<lang>/... with language selector in header (e.g., en, th)
  - Language-aware routes: /docs/en/:slug and /docs/th/:slug
  - Fallback to default language where content missing

## 4) Technical Approach (Recommended)

- Content ingestion
  - Use Vite’s import.meta.glob to discover Markdown/MDX files in /docs
  - Parse markdown using remark/rehype with syntax highlighting; optionally adopt MDX to embed React UI components
  - Frontmatter parsing (gray-matter) to extract metadata for nav and search

- Rendering & navigation
  - New pages: client/src/pages/Docs.tsx (landing) and client/src/pages/DocView.tsx (content)
  - Router: /docs, /docs/:slug, /docs/:version/:slug, optional /docs/:lang/:slug
  - Sidebar generated from frontmatter; sticky table of contents built from headings (rehype-toc)
  - Breadcrumbs reflect section → page

- Styling
  - Typography via @tailwindcss/typography and existing tokens in index.css
  - Header/footer reuse AppHeader and existing container utilities
  - Reuse shadcn/Radix components for alerts, tabs, accordions, callouts

- Search
  - Build-time Node script (scripts/build-docs-index.ts) reads /docs, parses content + frontmatter, produces public/docs-index.json
  - Client search uses FlexSearch or Lunr to query index; integrates into cmdk palette and on-page search

- Versioning & i18n
  - Folder convention: docs/<version>/<lang>/<section>/<slug>.md (lang optional)
  - Latest alias: docs/latest → symlink or configuration mapping
  - Language switch maintained in URL; default language from app settings or browser

- Alternative server-driven approach (optional)
  - tRPC docs router streams content from /docs at runtime; supports dynamic updates without rebuild
  - Good for admin editing workflows; requires ensuring /docs shipped with server artifacts and safe file IO

## 5) Implementation Plan

- Technology stack
  - React + Vite (existing)
  - Markdown/MDX: remark/rehype (and optional @mdx-js/react)
  - Frontmatter: gray-matter
  - Search: FlexSearch or Lunr.js
  - Styling: Tailwind v4 + @tailwindcss/typography, Radix + shadcn components
  - Routing: wouter

- Content structure guidelines
  - docs/
    - getting-started/
    - guides/
    - reference/
    - operations/
    - changelog/
    - v1/, v2/ … (optional versions)
    - en/, th/ … (optional languages)
  - Frontmatter example
    - title: string
    - description: string
    - section: one of [getting-started, guides, reference, operations, changelog]
    - order: number
    - version?: string
    - lang?: string

- Style guide integration points
  - Use container, focus-ring, glass-nav, motion tokens defined in client/src/index.css
  - Wrap markdown with prose classes and theme-aware colors
  - Provide design tokens (e.g., callout components) to present notes/warnings consistent with app

- Performance considerations
  - Lazy-load doc content via import.meta.glob for route-based code splitting
  - Cache parsed content in memory per session; avoid re-parsing on navigation
  - Pre-generate search index; limit payload size via excerpt and heading tokens
  - Respect prefers-reduced-motion for animated toc/affixes

- Maintenance strategy
  - Authoring workflow: write Markdown/MDX under /docs with frontmatter
  - Pre-commit checks: lint frontmatter and links; optional dead-link checker
  - scripts/build-docs-index.ts: regenerate index on build and dev
  - Versioning policy: increment folder version; maintain latest alias; document breaking changes in changelog
  - i18n policy: track source-of-truth in default language; mark untranslated pages with badges

## 6) Success Metrics

- Adoption
  - % of core features covered by docs; number of pages published
  - Time-to-first-success for new users (from “Getting Started”)

- Discoverability & search
  - Search success rate (queries leading to clicks)
  - Average query latency (target < 50 ms client-side)

- Consistency & UX
  - Visual parity with app (qualitative reviews); accessibility checks (WCAG AA)
  - Mobile usability score (internal rubric); bounce rate from docs pages

- Maintainability
  - Docs build time impact (target < 2s incremental)
  - Dead-link count over time; % pages with valid frontmatter

## 7) Rollout Steps (Phased)

- Phase 1: Prototype
  - Add /docs route and render a sample Markdown file (existing docs/login.md)
  - Confirm styling parity and theme switching; add AppHeader “Docs” link

- Phase 2: Navigation & Search
  - Implement frontmatter parsing and sidebar/toc generation
  - Build search index; integrate cmdk palette and on-page search

- Phase 3: Versioning & i18n (optional if needed)
  - Add folder conventions; update router to honor version/lang
  - Introduce language selector in header

- Phase 4: Content migration
  - Move existing docs into organized sections; add Getting Started and Reference
  - Document authoring guidelines

- Phase 5: QA & Metrics
  - Accessibility checks; performance baseline; success metrics instrumentation

## 8) Feasibility Summary

- Technical feasibility: High — fully compatible with current stack (React/Vite/Express), minimal risk
- Integration complexity: Low to Moderate — primarily client-side pages and a search index script
- Time estimate: 2–4 days (prototype + search + navigation), 1–2 weeks for full versioning/i18n roll-out
- Risks: Content governance and consistency; mitigated via frontmatter standards, pre-commit checks, and clear authoring guidelines