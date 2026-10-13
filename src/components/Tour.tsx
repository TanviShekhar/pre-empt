import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore, type Screen } from '../store';
import { Button, cx } from './ui';

interface Step {
  screen: Screen;
  orderId?: string;
  target: string; // matches a data-tour attribute
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    screen: 'overview',
    target: 'gauge',
    title: 'Your dispute ratio',
    body: 'The share of card payments that turned into disputes in the last 30 days. Banks start warning merchants above 0.7%. The lower row shows where January lands after the Diwali sale.',
  },
  {
    screen: 'overview',
    target: 'money',
    title: 'Money at risk',
    body: 'What the orders in your queue could cost if nobody acts, and how much you save by approving Pre-empt’s suggestions.',
  },
  {
    screen: 'queue',
    target: 'queue-table',
    title: 'Your review queue',
    body: 'Orders Pre-empt wants you to look at. Use “Sort by” and the tabs above to reorder or filter. Click any order to see why it was flagged.',
  },
  {
    screen: 'order',
    orderId: 'ORD-48213',
    target: 'why-flagged',
    title: 'Why an order was flagged',
    body: 'Each bar is one warning sign, like a late parcel or an unanswered refund request. Together they add up to the order’s dispute risk.',
  },
  {
    screen: 'order',
    orderId: 'ORD-48213',
    target: 'choose-action',
    title: 'You decide',
    body: 'Pre-empt compares each option by expected loss and recommends the cheapest. Nothing involving money happens until you approve.',
  },
  {
    screen: 'pings',
    target: 'pings-table',
    title: 'Soft pings',
    body: 'When a parcel looks late but the customer hasn’t complained, Pre-empt first asks “has it arrived?” for ₹0, before suggesting anything that costs money.',
  },
  {
    screen: 'controls',
    target: 'thresholds',
    title: 'You stay in control',
    body: 'Choose when Pre-empt may act on its own, cap what it can spend, and pause it anytime from the header. Some safety rules can never be switched off.',
  },
];

type Box = { top: number; left: number; width: number; height: number };

const findTarget = (t: string) => document.querySelector<HTMLElement>(`[data-tour="${t}"]`);

export function Tour() {
  const { state, dispatch } = useStore();
  const { active, step } = state.tour;
  const s = steps[Math.min(step, steps.length - 1)];
  const [box, setBox] = useState<Box | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(220);
  const last = step === steps.length - 1;

  useLayoutEffect(() => {
    if (active && cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [active, step]);

  // Move to the screen this step lives on.
  useEffect(() => {
    if (!active) return;
    if (state.screen !== s.screen || (s.orderId && state.orderId !== s.orderId)) {
      dispatch({ type: 'nav', screen: s.screen, orderId: s.orderId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  // Bring the highlighted element into view once the screen has rendered.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      const el = findTarget(s.target);
      if (!el) return;
      const tall = el.getBoundingClientRect().height > window.innerHeight * 0.55;
      el.scrollIntoView({ block: tall ? 'start' : 'center', behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(t);
  }, [active, step, state.screen, s.target]);

  // Track the element's position (it moves while the page scrolls or resizes).
  useEffect(() => {
    if (!active) return;
    const measure = () => {
      const el = findTarget(s.target);
      if (!el) return setBox(null);
      const r = el.getBoundingClientRect();
      const top = Math.max(8, r.top - 6);
      const bottom = Math.min(window.innerHeight - 8, r.bottom + 6);
      const next = { top, left: r.left - 6, width: r.width + 12, height: Math.max(0, bottom - top) };
      setBox((b) => (b && b.top === next.top && b.left === next.left && b.width === next.width && b.height === next.height ? b : next));
    };
    measure();
    const id = setInterval(measure, 100);
    return () => clearInterval(id);
  }, [active, step, s.target]);

  // Keyboard: Esc closes, arrows move.
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'endTour' });
      if (e.key === 'ArrowRight') dispatch(last ? { type: 'endTour' } : { type: 'tourStep', step: step + 1 });
      if (e.key === 'ArrowLeft' && step > 0) dispatch({ type: 'tourStep', step: step - 1 });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active, step, last, dispatch]);

  if (!active) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(360, vw - 32);
  let cardStyle: React.CSSProperties;
  if (box && vh - (box.top + box.height) > cardH + 16) {
    cardStyle = { top: box.top + box.height + 12, left: clamp(box.left, 16, vw - cardW - 16) };
  } else if (box && box.top > cardH + 16) {
    cardStyle = { top: box.top - cardH - 12, left: clamp(box.left, 16, vw - cardW - 16) };
  } else if (box && vw - (box.left + box.width) > cardW + 28) {
    // tall target: sit beside it, on the right
    cardStyle = { top: clamp(box.top + 24, 16, vh - cardH - 16), left: box.left + box.width + 16 };
  } else if (box && box.left > cardW + 28) {
    cardStyle = { top: clamp(box.top + 24, 16, vh - cardH - 16), left: box.left - cardW - 16 };
  } else {
    cardStyle = { bottom: 16, left: clamp(box ? box.left + box.width - cardW : vw - cardW - 16, 16, vw - cardW - 16) };
  }

  return (
    <div className="fixed inset-0 z-[130]" role="dialog" aria-modal="true" aria-label="How Pre-empt works">
      {/* dimmed page with a cut-out around the highlighted element */}
      {box ? (
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-white transition-all duration-300"
          style={{ ...box, boxShadow: '0 0 0 9999px rgba(15,27,45,0.55)' }}
        />
      ) : (
        <div className="fixed inset-0 bg-navy/55" />
      )}

      <div ref={cardRef} className="fade-in fixed rounded-card bg-white p-5 shadow-2xl" style={{ ...cardStyle, width: cardW }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            How it works · {step + 1} of {steps.length}
          </span>
          <button onClick={() => dispatch({ type: 'endTour' })} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close tour">
            ✕
          </button>
        </div>
        <h3 className="mt-1.5 text-base font-semibold text-slate-900">{s.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.body}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1" aria-hidden>
            {steps.map((_, i) => (
              <span key={i} className={cx('h-1.5 rounded-full transition-all', i === step ? 'w-4 bg-primary' : 'w-1.5 bg-slate-300')} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'tourStep', step: step - 1 })}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={() => dispatch(last ? { type: 'endTour' } : { type: 'tourStep', step: step + 1 })}>
              {last ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));
