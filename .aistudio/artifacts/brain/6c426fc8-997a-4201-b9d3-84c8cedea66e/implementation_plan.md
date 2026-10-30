# Implementation Plan: Creator Manga Upload Studio & Minimalist Glassmorphic Polish

Implement an end-to-end Creator Manga Upload Studio, panel sequencer, post-approval instant editor, reader orientation switcher, and minimalist glassmorphic navigation bar as requested.

---

## User Review & Critical Decisions Summary

> [!IMPORTANT]
> The following requirements have been synthesized from user clarifications and aesthetic guidelines:

- **Monetization & Creator Support**: Multi-model support including **Free with reader tipping**, **VIP Exclusive**, **Coin Unlock** per chapter, and transparent creator revenue analytics.
- **Reading Orientation & Preferences**:
  - Creators select default reading format during upload: **Vertical Webtoon** (continuous gapless flow) or **Horizontal Manga** (paged RTL/LTR).
  - Reader automatically launches in the creator's chosen preferred format by default, but readers have a 1-click toolbar toggle to switch anytime between Vertical and Horizontal modes.
- **Moderation & Post-Approval Creator Freedom**:
  - New series and newly submitted chapters undergo an initial Admin Review (`pending_review` -> `approved` or `rejected` with editorial feedback).
  - **Once approved**, the creator has full direct editing control in their Creator Dashboard to update title, synopsis, hero cover art, genre tags, and chapter panel ordering/replacements without requiring repeat admin re-approval.
- **Minimalist Aesthetic & Glassmorphic UI**:
  - Eliminate loud/garish colors (bright yellow stars, saturated VIP gold, bright red signout, neon green points) in favor of crisp, elegant monochrome/zinc/white styling.
  - Floating rounded bezel bars with backdrop blur (`backdrop-blur-xl bg-zinc-900/85 border border-white/10`) for the top header and bottom mobile navigation dock.
  - Interactive hover/press micro-animations (smooth scale/bounce) on navigation tabs and buttons.

---

## 1. System Architecture & Workflow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CREATOR STUDIO WORKFLOW                         │
└────────────────────────────────────────────────────────────────────────┘
          │
          ├──> 1. Series Editor (Metadata, Age Rating 13+/18+, Reading Default)
          │
          ├──> 2. Chapter Studio (Multi-Image Picker, Sorter Grid, Monetization)
          │
          ├──> 3. Instant Live Preview (Test read in seamless vertical or paged)
          │
          ├──> 4. Status Transition:
          │        • Auto-save local draft ('draft')
          │        • Submit for Admin Review ('pending_review')
          │
          └──> 5. Post-Approval Direct Editing:
                   • Edit any panel, cover, or text without re-approval!
                   • Reorder pages, upload replacements, save live immediately.
```

---

## 2. Proposed Implementation Details

### A. Data Schema & Models (`src/types/manga.ts`)
1. **MangaSeries**:
   - `readingFormat`: `'webtoon_vertical' | 'manga_horizontal'` (Creator's preferred reading mode).
   - `ageRating`: `'All Ages' | '13+' | '18+'` (Age advisory badge).
   - `isApprovedByAdmin`: `boolean` (Unlocks direct creator editing without re-moderation).
2. **Chapter**:
   - `monetizationType`: `'free' | 'vip' | 'coin'` with optional `coinCost?: number`.
   - `moderationStatus`: `'draft' | 'pending_review' | 'approved' | 'rejected'`.
   - `tippingEnabled`: `boolean` (Allows reader tipping jar).

### B. Creator Studio & Manga Editor (`src/pages/CreatorDashboardPage.tsx`)
1. **Multi-Image Panel Upload Dropzone**:
   - File picker supporting batch image selection (`multiple accept="image/*"`).
   - Instant conversion to optimized display URLs with progress feedback.
2. **Interactive Visual Sequencer & Direct Editor**:
   - Visual thumbnail cards showing Page numbers (`#1`, `#2`, `#3`...).
   - **Move Up**, **Move Down**, **Replace Image**, and **Delete Page** buttons on each panel.
   - Bulk "Add More Panels" button.
3. **Post-Approval Live Editing Mode**:
   - For approved manga series, creator can enter "Edit Series & Panels" directly from their series catalog tab.
   - Modify title, cover art, chapter panels, and sequence order.
   - One-click "Save Changes Live" with instant update to storage and notifications.
4. **Instant Live Preview Reader Modal**:
   - Test reader right inside the Creator Studio to preview continuous vertical gapless scroll or horizontal manga page flip before publishing.

### C. Reader Experience & Preference Toggles (`src/pages/ReaderPage.tsx`)
1. **Default to Creator's Preference**: Automatically initialize `readingMode` based on the series `readingFormat` (`'webtoon'` for vertical, `'page_flip'` for horizontal).
2. **Reader Toggle**: Prominent toggle button in the reader header/toolbar allowing readers to switch between Vertical Continuous Flow and Horizontal Paginated Flip at any time.
3. **Seamless Gapless Flow**: In vertical webtoon mode, enforce `gap-0`, no margins, and seamless image stitching.
4. **Creator Tipping Widget**: Clean, minimal monochrome tipping button at chapter end for readers to tip coins/UPI to the mangaka.

### D. Admin Moderation Desk (`src/pages/AdminDashboardPage.tsx`)
1. **Initial Review Queue**: Inspect submitted series and chapters with thumbnail previews.
2. **Approve / Reject Actions**:
   - Approve: Sets status to `approved`, notifies creator, publishes to public catalog, and permanently unlocks direct creator editing.
   - Reject: Allows admin to leave specific reviewer notes to help creator revise.

### E. Minimalist Glassmorphic UI & Visual Polish
1. **Garish Colors Removal**:
   - Replace yellow stars with clean minimal monochrome stars.
   - Replace gold VIP badge with elegant minimal monochrome badge (`bg-white/10 text-white border border-white/20`).
   - Replace red sign out button with subtle minimal neutral button (`hover:bg-zinc-800 text-zinc-300`).
   - Style coins, points, and goods in minimal high-contrast monochrome tags.
2. **Curved Glassmorphic Header & Navigation**:
   - Apply rounded bezel edges (`rounded-2xl mx-3 sm:mx-6 my-2`).
   - Glassmorphism: `backdrop-blur-xl bg-zinc-900/80 border border-white/10 shadow-2xl`.
   - Micro-animations: Interactive bounce/scale effect on hover and click for Home, Browse, Library, and Profile icons (`active:scale-90 hover:scale-110 transition-transform duration-200`).

---

## 3. Verification & Testing Plan

1. **Compilation**: Run `compile_applet` to ensure zero TypeScript errors or missing imports.
2. **Creator Upload Flow**:
   - Open Creator Dashboard (`/creator`).
   - Create a new series with Cover, Age Rating (`18+`), and Reading Preference (`Vertical Webtoon`).
   - Upload multiple chapter panels via file picker.
   - Reorder panels using Move Up / Down controls.
   - Open Live Preview to verify gapless vertical webtoon flow.
   - Submit for Admin Review.
3. **Admin Approval & Post-Approval Editing**:
   - Switch to Admin Dashboard (`/admin`) and approve the new series and chapter.
   - Return to Creator Dashboard and edit the approved manga (change title, swap a panel, reorder pages) to verify it updates immediately without re-moderation.
4. **Reader Experience**:
   - Open the manga in the Reader to verify it opens in vertical mode by default.
   - Click the format toggle to switch to horizontal paginated mode and back.
5. **UI & Aesthetic Check**:
   - Verify floating rounded header and bottom bar with glassmorphic blur and icon micro-animations.
   - Verify all star ratings, VIP badges, and buttons use minimal monochrome styling.
