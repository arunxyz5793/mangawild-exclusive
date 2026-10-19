# MangaWild Minimal Redesign & Feature Modernization Plan

Streamlines the MangaWild creator dashboard with minimal 30-day ranked views and likes metrics, locks the website into a permanent high-performance dark slate theme, modernizes authentication with auto-clearing error states and email OTP password recovery, eliminates the points system and harsh gold accents in favor of subtle monochrome styling, and adds in-app subscription cancellation with dedicated support.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed directly through the Phase 1 questionnaire and will govern the implementation:

- **Confirmed Decision 1 (Dashboard Analytics)**: Replace cluttered multi-chart widgets with a clean ranked list for manga series featuring an intuitive toggle between **Views** and **Likes**, defaulting to a **30-Day** rolling window with tabular numerals.
- **Confirmed Decision 2 (Subscription Cancellation & Support)**: Provide an in-app "Cancel Subscription" flow featuring a reason-selection modal, clear billing period end messaging, and a dedicated support contact section (`support@mangawild.online`).
- **Confirmed Decision 3 (Forgot Password & Recovery)**: Implement a direct email confirmation screen with a 6-digit OTP code entry interface for seamless account password recovery.
- **Confirmed Decision 4 (Permanent Dark Theme)**: Lock the app permanently into the refined dark slate/charcoal palette. Remove light mode and the header/drawer theme toggle button to prevent accidental switching.
- **Confirmed Decision 5 (Points Removal & Anti-Gold Styling)**: Completely eliminate the points currency system across the site (navigation, packs, unlocking), remove all gold/amber colors in favor of cool slate/monochrome, and soften completion checkmarks into minimal graphite/slate icons.
- **Confirmed Decision 6 (Login Validation UX)**: Automatically clear the red credentials warning message the moment the user begins modifying (typing or clearing) the email or password fields.

---

## 1. Overview & Core Concept

### What It Delivers
This modernization eliminates visual clutter, cognitive fatigue, and heavy client-side processing across MangaWild. It transforms the creator dashboard from a noisy analytics hub into an actionable, minimal performance leaderboard; strips out distracting gamification (points, gold badges, garish completion ticks); speeds up rendering for budget mobile devices; and refines core user journeys (frictionless login, OTP password reset, effortless subscription management).

### Target Audience
- **Manga Readers**: Value deep reading immersion, minimal distraction, zero blinding light shifts, and straightforward VIP membership management.
- **Indie Manga Creators**: Want immediate, clean clarity on how their manga chapters are performing (views and reader likes over 30 days) without complex data visualization overhead.

### Key Value
- **Zero Performance Lag**: Removing dynamic theme recalculations, heavy charts, and gratuitous animations ensures sub-second rendering even on low-end mobile hardware.
- **Calm, Premium Aesthetic**: Monochromatic slate with intentional micro-contrasts replaces loud yellow/amber badges and harsh green highlights.
- **Transparent Control**: Readers can manage, cancel, or seek support for their subscriptions without hidden menus or dark patterns.

---

## 2. User Experience & Visual Design

### Key User Flows

#### A. Streamlined 30-Day Analytics Flow (Dashboard)
1. Creator or Admin opens the Dashboard (`CreatorDashboardPage.tsx` / `AdminDashboardPage.tsx`).
2. Immediate view of the **30-Day Performance Leaderboard**:
   - Timeframe pill: `30 Days (Default)` · `7 Days` · `90 Days`.
   - Segmented metric switch: `[ Views Ranking ]` | `[ Likes Ranking ]`.
3. High-density, minimal ranked rows:
   - Numerical rank index (`#01`, `#02`, `#03`...).
   - Manga cover thumbnail with title and genre.
   - Clean tabular figure metric (e.g., `148,290 views` or `12,450 likes`).
   - Clean delta indicator (`+14.2% this month` in muted slate, no loud badges).
4. No noisy multi-line SVG charts, canvas overhead, or nested card wrappers.

#### B. Frictionless Login & Auto-Clearing Error State
1. User enters invalid email or password in `AuthModal.tsx` and clicks "Sign In".
2. Error message banner appears cleanly above inputs: `"Invalid email address or password"`.
3. The moment the user types a new character or backspaces either field, the error state instantly vanishes (`setError(null)`).
4. The error will only reappear if the user submits the form again and authentication fails.

#### C. Forgot Password OTP Verification Flow
1. User clicks `"Forgot password?"` on the login dialog.
2. Step 1: User enters email and clicks `"Send Verification Code"`.
3. Step 2: Screen transitions cleanly to `"Enter 6-Digit Code"`:
   - Confirmation notice: `"We sent a 6-digit verification code to your email."`
   - Individual 6-box OTP input with auto-advance and backspace navigation.
   - Resend code timer (`Resend in 30s`).
4. Step 3: Once verified, user enters and confirms their new password, receives an instant success toast, and is logged in.

#### D. Minimal Membership & In-App Cancellation Flow
1. User visits `MembershipPage.tsx`:
   - All points packs, point counters, and gold badges removed.
   - Crisp, minimal VIP pass tiers with clear monthly/annual pricing and concrete benefits.
2. If the user holds an active membership, a clean `"Manage Subscription"` panel appears.
3. User clicks `"Cancel Subscription"`:
   - Subtle modal appears asking for feedback (e.g., *"Finished reading current series"*, *"Taking a break"*, *"Cost concerns"*, *"Other"*).
   - Clear confirmation: *"Your VIP access will remain active until the end of your billing cycle on [Date]. No further charges will occur."*
   - Confirmation button updates subscription status in local storage/Firestore and shows support contact details.
4. Dedicated `"Need Help with Billing or Reading?"` support section at the bottom of the page with direct email and support inquiry form.

### Visual Identity & Theme
- **Theme Posture**: Locked permanently to **Dark Slate** (`#090d16` canvas, `#111827` cards, `#1e293b` borders). Light mode toggles and white themes are completely excised.
- **Color Discipline**:
  - Dominant Neutral (60%): `#090d16` (Deep Manga Midnight)
  - Structural Surface (30%): `#111827` (Card Surface) & `#1e293b` (Subtle 1px Borders)
  - Accent Budget (10%): `#f8fafc` (Pure White Contrast Text) & `#38bdf8` (Refined Slate-Sky for active controls only)
  - Anti-Gold Ban: Zero amber/yellow tones anywhere. All VIP crowns and tier tags use crisp platinum slate (`#e2e8f0` / `#94a3b8`).
  - Chapter Complete Tick: Replaced loud green circle tick with an understated slate-gray verified check (`#94a3b8` on `#1e293b`).
- **Typography**:
  - Brand Mark: `Rockidz 3D` (already integrated into header, reader bar, and footer).
  - Headings: `Plus Jakarta Sans` / `Cinzel` in clean title case (no comment slashes `//` or pseudo-code).
  - Metrics & Leaderboard: `font-mono tabular-nums` for precise alignment.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Single Ranked Leaderboard vs Multi-Chart Canvas
- **Chosen Approach**: Replace the cluttered `CreatorAnalyticsCharts.tsx` with a single, highly readable ranked leaderboard that toggles between Views and Likes.
- **Why**: Multi-axis canvas charts cause layout jank on low-end phones, are difficult to read on small touchscreens, and do not directly answer the creator's core question: *"Which of my manga are performing best?"*
- **Trade-off**: Removes detailed daily line-chart oscillations in exchange for instant clarity and zero mobile lag.

### Decision 2: Permanent Dark Theme Lock vs Toggle Preservation
- **Chosen Approach**: Lock `index.html` to `class="dark"`, hardcode `ThemeContext` to dark mode, and remove the sun/moon toggle from headers and drawers.
- **Why**: Manga artwork, high-contrast comic panels, and midnight reading sessions suffer heavily on stark white backgrounds. Removing light mode eliminates several kilobytes of redundant CSS variables, prevents layout flash on load, and respects user preference.

### Decision 3: Complete Removal of Points System
- **Chosen Approach**: Excise points counters, `"Buy Points"` cards, and currency multipliers across the application. Manga chapters are either free or unlocked via the VIP All-Access Membership.
- **Why**: Dual-currency systems (paying real money to buy digital points to unlock single chapters) frustrate readers and clutter the navigation with point stores. A clean VIP subscription model is far more transparent.

---

## 4. Technical Architecture & Data Strategy

### System & Component Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Top Bar                        │
│   [Rockidz 3D Wordmark] ──── [Browse / Library / VIP] ──── [Profile]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│      Creator / Admin Console      │ │       Authentication Modal       │
│                                   │ │                                  │
│ ┌───────────────────────────────┐ │ │ ┌──────────────────────────────┐ │
│ │  30-Day Manga Leaderboard     │ │ │ │ Email / Password Inputs      │ │
│ │  • Toggle: [Views] | [Likes]  │ │ │ │ • Dynamic Error Auto-Clear   │ │
│ │  • Range: 7d | 30d (def) | 90d│ │ │ └──────────────┬───────────────┘ │
│ │  • Ranked #1..#N series cards │ │ │                ▼                 │
│ │  • Tabular figures (no jank)  │ │ │ ┌──────────────────────────────┐ │
│ └───────────────────────────────┘ │ │ │ Forgot Password 6-Digit OTP  │ │
│                                   │ │ │ • Code verification screen   │ │
│ ┌───────────────────────────────┐ │ │ │ • Resend countdown & reset   │ │
│ │  Creator Upload & Series List │ │ │ └──────────────────────────────┘ │
│ └───────────────────────────────┘ │ └──────────────────────────────────┘
└───────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Membership & Billing Page                       │
│                                                                        │
│ ┌───────────────────────────────┐   ┌────────────────────────────────┐ │
│ │ Minimal VIP Subscription Card │   │ Active Subscription Manager    │ │
│ │ • No points / No gold clutter │   │ • [Cancel Subscription] button │ │
│ │ • Concrete reader perks       │   │ • Cancellation Reason Modal    │ │
│ └───────────────────────────────┘   └────────────────────────────────┘ │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Dedicated Reader Support & Help Center                             │ │
│ │ • support@mangawild.online · Inquiry Form · Billing FAQs           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Component & State Mutations

1. **`AuthModal.tsx`**:
   - `handleInputChange(field, val)`: Calls `setError(null)` whenever user edits credentials.
   - `authMode`: Extended with `'forgot_password'` (email entry) and `'verify_otp'` (6-digit code entry + new password).
   - Instant verification feedback with clear helper text.

2. **`CreatorAnalyticsCharts.tsx` / `CreatorDashboardPage.tsx`**:
   - Replaced with `MinimalMangaLeaderboard.tsx`.
   - State `selectedMetric: 'views' | 'likes'` (default `'views'`).
   - State `timeframe: '7d' | '30d' | '90d'` (default `'30d'`).
   - Pure CSS list layout using `tabular-nums` and lightweight SVG icons.

3. **`MembershipPage.tsx` & `Footer.tsx`**:
   - Purged all references to `"Points"`, `"Coins"`, and `"Coin Store"`.
   - State `showCancelModal: boolean` and `cancelReason: string`.
   - Updated subscription handler to flag cancellation in storage without breaking current access period.
   - Embedded `<SupportSection />` with email contact and direct help ticket modal.

4. **`ReaderPage.tsx`**:
   - Chapter completion banner updated: replaced vibrant green check circle with a minimalist slate badge (`bg-slate-800 text-slate-300 border border-slate-700`).

---

## Verification & Acceptance Criteria
- [ ] Dashboard shows clean 30-day ranked lists with views/likes toggle without lag or cluttered charts.
- [ ] Login error message disappears immediately upon editing email or password.
- [ ] Forgot password flow supports email submission and 6-digit OTP code entry.
- [ ] All points mentions and points purchase options are removed from the site.
- [ ] All golden/amber buttons, borders, and text are converted to sleek slate/monochrome.
- [ ] Reader chapter completed icon is styled with subtle graphite/slate instead of bright green.
- [ ] Active subscribers can request cancellation via the modal with reasons and confirmation.
- [ ] Dedicated support section is visible on the membership page and footer.
- [ ] Applet builds and lints with 0 errors.
