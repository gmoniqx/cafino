# Cafino Online MVP

Last updated: 2026-03-21
Owner: Product + Engineering
Status: Active (living document)

## 1. Product Goal
Build a mobile-first coffee tracking app that lets users quickly log drinks, monitor daily caffeine/sugar/spend, view trends, and personalize the experience with persistent themes and settings.

## 2. Target Users
- Daily coffee drinkers who want lightweight tracking
- Users who prefer a mobile-style UI on web
- Users who care about caffeine, sugar, and spend trends

## 3. Core MVP Scope
In scope:
- Local auth session (sign in, sign out)
- Home tracking flow (add/edit/remove/share coffee logs)
- Calendar-based day browsing
- Stats view (week/month/year summaries)
- Settings (daily limit, toggles, wallpaper, widgets guide)
- Brand Management sheet (local custom brand list)
- About Developer sheet (contact, portfolio, feedback, donation CTA)
- Theme picker with persistence across routes and reloads
- Dashboard page with quick progress summary
- Installable mobile PWA (Add to Home Screen)
- Offline fallback page and cached app shell
- Drink type image icons (PNG-based with fallback)
- Compact responsive UI system for small to large phone widths

Out of scope (post-MVP):
- Backend sync and multi-device account data
- Team/social features
- Push notifications
- AI recommendations

## 4. Current Feature Status
### Authentication
- [x] Login screen with basic validation
- [x] Session persistence in localStorage
- [x] Route guard behavior for dashboard

### Coffee Tracking
- [x] Add and edit logs
- [x] Delete logs
- [x] Optional photo, notes, metadata (size/temp/sugar/price)
- [x] Swipe actions for share/delete
- [x] Drink type selector with image icons and fallback

### Calendar + Daily Detail
- [x] Month navigation
- [x] Date-level records panel
- [x] Daily totals (cups/caffeine/sugar)
- [x] Circular day cells for cleaner visual rhythm

### Analytics
- [x] Week/month/year filters
- [x] Cups, caffeine, sugar, spend summaries
- [x] Bar chart visualization
- [x] Stats sharing fallback (native share or clipboard)

### Theming + UX
- [x] Multi-theme picker
- [x] Theme preference persistence
- [x] Theme applied across Home, Stats, Settings, Login, Dashboard
- [x] Accent, surface, border, and text tinting tied to active theme
- [x] Compact layout pass with responsive spacing/typography
- [x] Updated landing/Get Started hero and feature presentation

### Settings Extensions
- [x] Widgets instruction popup
- [x] Brand Management and Add Brand flows (local state)
- [x] About Developer section with direct email and portfolio actions
- [x] Feedback email compose flow (mailto with subject)

### Mobile Delivery
- [x] Web app manifest for install prompts
- [x] Service worker registration and app-shell caching
- [x] Offline fallback route for no-network states
- [x] Landing-page install CTA for supported browsers
- [x] iOS Safari Add to Home Screen helper popup

## 5. Non-Functional MVP Requirements
- Mobile-first responsive layout (usable from small phones up to tablet-like widths)
- Fast local interactions (no backend dependency for core actions)
- Clean lint state in main branch
- Accessible controls for core flows (buttons, forms, toggles)

## 6. Success Criteria
- User can complete first log in under 60 seconds
- User can switch themes and see app-wide visual update instantly
- Theme choice persists after refresh and route changes
- User can read daily progress and month-level trends without setup
- User can install app from supported mobile browsers without external store

## 7. Known Risks
- Data loss risk if browser storage is cleared
- No cross-device sync in MVP
- Image data in local storage may increase storage usage over time
- Missing/misnamed drink icon files will trigger fallback visuals

## 8. Next Priorities (Post-MVP Candidates)
1. Export/import local data backup
2. Cloud sync with authenticated backend
3. Better accessibility audit (focus order/contrast/keyboard)
4. Lightweight onboarding tips for first-time users
5. Performance guardrails for large log history

## 9. Change Log
- 2026-03-21: Initial MVP doc created for online-only Cafino app.
- 2026-03-21: Recorded theme system as app-wide and persisted.
- 2026-03-21: Added installable PWA support (manifest, service worker, offline fallback).
- 2026-03-21: Added landing install button and iOS Safari install guidance popup.
- 2026-03-21: Added compact responsive UI pass and stronger landing page presentation.
- 2026-03-21: Added widgets guide, Brand Management, and About Developer settings flows.
- 2026-03-21: Added drink type PNG icon support with emoji fallback.
- 2026-03-21: Updated calendar day shape to circular cells.

## 10. Update Policy
Treat this file as a living MVP contract.
Update it when:
- Scope changes
- A core feature is added/removed
- Success criteria or risks change
- A major architecture decision affects delivery
