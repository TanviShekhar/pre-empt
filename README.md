# Pre-empt — concept prototype

Clickable prototype of a dispute-prevention agent for a merchant dashboard (concept for Razorpay Agent Studio).
All data is synthetic and hard-coded in `src/data.ts`. No backend, no external calls, no real payments.

**Live demo:** https://pre-empt.vercel.app

**AI build log:** [BUILD_LOG.md](BUILD_LOG.md) · **Economics model:** [economics_model.py](economics_model.py) (run `python3 economics_model.py` to reproduce every figure)

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 (designed for 1440px wide, usable at 1280px).

`npm run build` type-checks and produces a static site in `dist/` that can be hosted anywhere (Vercel, Netlify, GitHub Pages).

## Structure

- `src/data.ts` — every number, label and message in the demo
- `src/store.tsx` — in-memory state (React `useReducer`); reload the page to start over
- `src/screens/` — Overview, Review queue, Order detail, Soft pings, Controls, Audit log
- `src/components/` — layout, gauge, tooltips, drawers, toasts

## 90-second demo path

New here? Click **How it works** in the agent header for a guided tour.

1. Overview: 0.80% now, January projected 1.70% with no action.
2. Click "Money at risk in your queue" (₹4,404) → Review queue, sorted by money saved.
3. Click ORD-48213 → hover "Why flagged"; compare do nothing ₹1,008 vs message + credit ₹310.
4. Approve → check animation, timeline updates.
5. Click "See January projection on Overview" → blue January marker at 1.66%.
6. Soft pings → ORD-48230: Pre-empt asks "has it arrived?" for ₹0 before spending anything.
7. Review queue → ORD-48102 "Request evidence"; ORD-47856 credit blocked by guardrail.
8. Controls → caps, never-act rules, lane baselines.
9. Audit log → every decision with its Rule / AI model method tags.
