# Mobile Responsive Implementation

## What changed

- Added `src/styles/mobile.css` — **all rules are inside `@media (max-width: 767px)`** so desktop (768px and up) is unchanged.
- Imported `mobile.css` in `src/main.jsx` (one line).
- Added semantic CSS class names on layout wrappers only (no desktop style changes).

## Revert completely

1. Remove `import './styles/mobile.css'` from `src/main.jsx`.
2. Delete `src/styles/mobile.css`.
3. Optionally remove `MOBILE_RESPONSIVE.md` and layout class names from JSX (classes are inert without the CSS file).

Or revert the git commit:

```bash
git revert <commit-sha>
```

## Revert partially

- Disable mobile styles temporarily: comment out the import in `main.jsx`.
- Tune breakpoint: change `767px` to `639px` or `1023px` in `mobile.css` only.

## Deploy

- **Vercel**: `vercel.json` added for SPA routing. Connect repo in Vercel dashboard or run `vercel --prod`.
- **GitHub**: push branch `main` (or a feature branch) after review.

## Verify on mobile

1. Chrome DevTools → Toggle device toolbar → iPhone 14 / Pixel 7.
2. Check: Landing header, Auth forms, Dashboard header, Admin horizontal nav, Approval cards, Checkout modal.

## Breakpoint

| Viewport | Behavior |
|----------|----------|
| ≥ 768px | Original desktop layout (inline styles only) |
| ≤ 767px | `mobile.css` overrides via `!important` where needed to beat inline styles |
