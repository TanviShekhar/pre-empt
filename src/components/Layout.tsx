import { useEffect } from 'react';
import { merchant } from '../data';
import { awaitingPings, pendingCount, useStore, type Screen } from '../store';
import { Tooltip, cx } from './ui';

const productTabs = ['Payments', 'Banking+', 'Payroll', 'Agent Studio'];

export function TopBar() {
  return (
    <div className="flex h-14 items-center gap-4 bg-navy px-4 text-white sm:px-6">
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[15px] font-semibold tracking-tight">Agent Studio</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Beta</span>
      </div>

      <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Products">
        {productTabs.map((t) =>
          t === 'Agent Studio' ? (
            <span key={t} className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white">
              {t}
            </span>
          ) : (
            <Tooltip key={t} content="Outside this prototype" width={170}>
              <span tabIndex={0} aria-disabled="true" className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm text-slate-500">
                {t}
              </span>
            </Tooltip>
          ),
        )}
      </nav>

      <div className="ml-auto flex items-center gap-4 lg:ml-0">
        <div className="hidden items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-slate-400 xl:flex">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            readOnly
            tabIndex={-1}
            placeholder="Search payments, orders, settings"
            className="w-56 cursor-default bg-transparent text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-slate-200 sm:inline">{merchant.name}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold">{merchant.initials}</span>
        </div>
      </div>
    </div>
  );
}

export function AgentHeader() {
  const { state, dispatch } = useStore();
  const modeName = state.mode === 'review' ? 'Review-first' : state.mode === 'recommend' ? 'Recommend-only' : 'Auto within limits';
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6">
      <button onClick={() => dispatch({ type: 'nav', screen: 'overview' })} className="text-[15px] font-semibold text-slate-900">
        Pre-empt <span className="font-normal text-slate-500">· Dispute Prevention Agent</span>
      </button>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => dispatch({ type: 'startTour' })}
          aria-label="How it works"
          title="How it works"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-2.5"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-600" aria-hidden>
            <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 3v18l15-9z" />
            </svg>
          </span>
          <span className="hidden sm:inline">How it works</span>
        </button>
        <span
          className={cx(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
            state.paused ? 'bg-slate-100 text-slate-600 ring-slate-300' : 'bg-green-50 text-green-700 ring-green-200',
          )}
        >
          <span className={cx('h-1.5 w-1.5 rounded-full', state.paused ? 'bg-slate-400' : 'bg-ok')} />
          {state.paused ? 'Paused' : `Active · ${modeName}`}
        </span>
        <button
          onClick={() => dispatch({ type: 'togglePause' })}
          className={cx(
            'rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors',
            state.paused ? 'bg-ok text-white ring-ok hover:bg-green-700' : 'text-risk ring-red-300 hover:bg-red-50',
          )}
        >
          {state.paused ? 'Resume agent' : 'Pause agent'}
        </button>
      </div>
    </div>
  );
}

const navItems: { screen: Screen; label: string }[] = [
  { screen: 'overview', label: 'Overview' },
  { screen: 'queue', label: 'Review queue' },
  { screen: 'pings', label: 'Soft pings' },
  { screen: 'controls', label: 'Controls' },
  { screen: 'audit', label: 'Audit log' },
];

const icons: Record<Screen, string> = {
  overview: 'M3 12l9-8 9 8v8a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
  queue: 'M4 6h16M4 12h16M4 18h10',
  order: '',
  pings: 'M4 5h16v11H8l-4 4z',
  controls: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6',
  audit: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h3',
};

function useNav() {
  const { state, dispatch } = useStore();
  const badges: Partial<Record<Screen, number>> = { queue: pendingCount(state), pings: awaitingPings(state) };
  const active = state.screen === 'order' ? 'queue' : state.screen;
  return { badges, active, items: navItems, go: (s: Screen) => dispatch({ type: 'nav', screen: s }) };
}

function Badge({ screen, n }: { screen: Screen; n?: number }) {
  if (!n) return null;
  return (
    <span className={cx('min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold text-white', screen === 'queue' ? 'bg-primary' : 'bg-amber-500')}>
      {n}
    </span>
  );
}

export function Sidebar() {
  const { badges, active, items, go } = useNav();
  return (
    <nav className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 md:flex" aria-label="Pre-empt">
      <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pre-empt</div>
      <ul className="space-y-1">
        {items.map((n) => (
          <li key={n.screen}>
            <button
              onClick={() => go(n.screen)}
              className={cx(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active === n.screen ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={icons[n.screen]} />
              </svg>
              <span className="flex-1 text-left">{n.label}</span>
              <Badge screen={n.screen} n={badges[n.screen]} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
        <div className="mb-1 font-semibold text-slate-700">{merchant.name}</div>
        {merchant.description}.
      </div>
    </nav>
  );
}

/** Horizontal, scrollable tab bar that replaces the sidebar on narrow screens. */
export function MobileTabs() {
  const { badges, active, items, go } = useNav();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1.5 md:hidden" aria-label="Pre-empt">
      {items.map((n) => (
        <button
          key={n.screen}
          onClick={() => go(n.screen)}
          className={cx(
            'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
            active === n.screen ? 'bg-blue-50 text-primary' : 'text-slate-600',
          )}
        >
          {n.label}
          <Badge screen={n.screen} n={badges[n.screen]} />
        </button>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
      <span>Concept prototype for Razorpay Agent Studio by Tanvi Shekhar. Merchant, orders and figures are synthetic.</span>
    </footer>
  );
}

export function Toasts() {
  const { state, dispatch } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[calc(100vw-2rem)] max-w-[380px] flex-col gap-2">
      {state.toasts.map((t) => (
        <ToastItem key={t.id} text={t.text} tone={t.tone} onDone={() => dispatch({ type: 'dismissToast', id: t.id })} />
      ))}
    </div>
  );
}

function ToastItem({ text, tone, onDone }: { text: string; tone: 'ok' | 'info' | 'warn'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bar = tone === 'ok' ? 'bg-ok' : tone === 'warn' ? 'bg-warn' : 'bg-primary';
  return (
    <div className="toast-in pointer-events-auto flex overflow-hidden rounded-lg bg-navy text-sm text-white shadow-xl">
      <div className={cx('w-1.5 shrink-0', bar)} />
      <div className="flex-1 px-4 py-3 leading-snug">{text}</div>
      <button onClick={onDone} className="px-3 text-slate-400 hover:text-white" aria-label="Dismiss">✕</button>
    </div>
  );
}
