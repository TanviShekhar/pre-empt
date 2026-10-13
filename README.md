# Pre-empt — concept prototype

Clickable prototype of a dispute-prevention agent for a merchant dashboard (concept for Razorpay Agent Studio).
All data is synthetic and hard-coded in `src/data.ts`. No backend, no external calls, no real payments.

**Live demo:** https://pre-empt.vercel.app

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 (designed for 1440px wide, usable at 1280px).

`npm run build` type-checks and produces a static site in `dist/` that can be hosted anywhere (Vercel, Netlify, GitHub Pages).

## Structure

- `src/data.ts` — every number, label and message in the demo
- `src/store.tsx` — in-memory state (React `useReducer`); the "Reset demo" footer link restores it
- `src/screens/` — Overview, Review queue, Order detail, Soft pings, Controls, Impact & learning, Audit log
- `src/components/` — layout, gauge, tooltips, drawers, toasts

## 90-second demo path

1. Overview: 0.80% now, January projected 1.70%.
2. Click "Awaiting your review 5" → Review queue.
3. Click ORD-48213 → hover "Why flagged"; compare do nothing ₹1,008 vs message + credit ₹310.
4. Approve → check animation, timeline updates (Fast-forward 2 days is optional).
5. Overview → blue January marker at 1.66%.
6. Soft pings → ORD-48230 → "Yes, received" → closed at ₹0.
7. Review queue → ORD-48102 "Request evidence"; ORD-47856 credit blocked by guardrail.
8. Controls → caps, never-act rules, lane baselines.
9. Overview → "Project steady state" → marker animates to 1.17%.
