import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { EXPECTED_LOSS_FORMULA } from '../data';
import { pc, riskLevel } from '../format';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Card({
  children,
  className,
  title,
  right,
  tour,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  right?: ReactNode;
  tour?: string; // anchor for the "How it works" tour
}) {
  return (
    <section data-tour={tour} className={cx('rounded-card bg-white shadow-card border border-slate-200/70', className)}>
      {title && (
        <header className="flex items-start justify-between gap-4 px-6 pt-5">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {right}
        </header>
      )}
      <div className={title ? 'px-6 pb-6 pt-3' : 'p-6'}>{children}</div>
    </section>
  );
}

type ChipTone = 'blue' | 'green' | 'amber' | 'red' | 'grey' | 'navy';
const chipTones: Record<ChipTone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  green: 'bg-green-50 text-green-700 ring-green-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  grey: 'bg-slate-100 text-slate-600 ring-slate-200',
  navy: 'bg-white/10 text-white ring-white/20',
};

/** Rounded pill for short labels; `wrap` gives a slightly rounded tag that can span several lines cleanly. */
export function Chip({ children, tone = 'grey', className, wrap }: { children: ReactNode; tone?: ChipTone; className?: string; wrap?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 px-2.5 text-xs font-medium ring-1 ring-inset',
        wrap ? 'rounded-md py-1 text-left leading-snug' : 'whitespace-nowrap rounded-full py-0.5',
        chipTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RiskChip({ p, suffix }: { p: number; suffix?: string }) {
  const lvl = riskLevel(p);
  const tone: ChipTone = lvl === 'High' ? 'red' : lvl === 'Medium' ? 'amber' : 'green';
  return (
    <Chip tone={tone}>
      {lvl}{' '}
      <span className="font-normal opacity-80">
        · {pc(p)}
        {suffix ? ` ${suffix}` : ''}
      </span>
    </Chip>
  );
}

/** Hover tooltip rendered in a portal with fixed positioning, so it never clips inside tables or cards. */
export function Tooltip({ content, children, className, width = 280 }: { content: ReactNode; children: ReactNode; className?: string; width?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean }>({ left: 0, top: 0, above: true });

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const tipH = tipRef.current?.offsetHeight ?? 60;
    const above = r.top > tipH + 16;
    let left = r.left + r.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setPos({ left, top: above ? r.top - tipH - 8 : r.bottom + 8, above });
  }, [open, width]);

  return (
    <span
      ref={ref}
      className={className ?? 'inline-flex'}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={{ left: pos.left, top: pos.top, width }}
            className="pointer-events-none fixed z-[100] rounded-lg bg-navy px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-lg"
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}

export function InfoTip({ content, width }: { content: ReactNode; width?: number }) {
  return (
    <Tooltip content={content} width={width}>
      <span tabIndex={0} className="ml-1 inline-flex h-4 w-4 shrink-0 cursor-help normal-case items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 hover:border-primary hover:text-primary" aria-label="More info">
        i
      </span>
    </Tooltip>
  );
}

/** "Expected loss" label, always carrying the formula tooltip. */
export function ExpectedLossLabel({ className, text = 'Expected loss' }: { className?: string; text?: string }) {
  return (
    <Tooltip content={EXPECTED_LOSS_FORMULA} width={320}>
      <span tabIndex={0} className={cx('cursor-help border-b border-dotted border-slate-400', className)}>
        {text}
      </span>
    </Tooltip>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger-outline' | 'success';
const btn: Record<BtnVariant, string> = {
  primary: 'bg-primary text-white hover:bg-blue-700 disabled:bg-blue-300',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  ghost: 'text-primary hover:bg-blue-50 disabled:text-slate-400',
  'danger-outline': 'text-risk ring-1 ring-inset ring-red-300 bg-transparent hover:bg-red-50',
  success: 'bg-ok text-white hover:bg-green-700',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm',
        btn[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-card bg-white shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="border-b border-slate-100 px-6 py-4 text-[15px] font-semibold">{title}</div>
        <div className="px-6 py-5 text-sm text-slate-700">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] bg-navy/40" onClick={onClose}>
      <aside className="drawer-in absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="text-[15px] font-semibold">{title}</div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

/** Animates a number towards its target value. */
export function useAnimatedNumber(target: number, duration = 900, initial = target) {
  const [val, setVal] = useState(initial);
  const fromRef = useRef(initial);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * e;
      setVal(v);
      fromRef.current = v;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // rAF pauses in background tabs; make sure we always land on the target
    const done = setTimeout(() => {
      cancelAnimationFrame(raf);
      setVal(target);
      fromRef.current = target;
    }, duration + 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [target, duration]);
  return val;
}

export function CheckBurst({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" className="check-burst" aria-hidden>
      <circle cx="26" cy="26" r="24" fill="none" stroke="#16A34A" strokeWidth="3" className="check-circle" />
      <path fill="none" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M15 27 l7 7 l15 -16" className="check-mark" />
    </svg>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{children}</h1>
      {sub && <p className="mt-1.5 max-w-3xl text-sm text-slate-600">{sub}</p>}
    </div>
  );
}

export function Toggle({ on, onChange, disabled, label }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={cx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        on ? 'bg-primary' : 'bg-slate-300',
        disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <span className={cx('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', on ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </button>
  );
}

export function WhatsAppBubble({ children, from = 'out', tag }: { children: ReactNode; from?: 'out' | 'in'; tag?: ReactNode }) {
  return (
    <div className={cx('flex', from === 'out' ? 'justify-end' : 'justify-start')}>
      <div className={cx('max-w-[90%] rounded-xl px-3 py-2 text-[13px] leading-snug shadow-sm', from === 'out' ? 'rounded-tr-sm bg-[#DCF8C6] text-slate-800' : 'rounded-tl-sm bg-white text-slate-800')}>
        {children}
        {tag && <div className="mt-1 text-right text-[10px] text-slate-500">{tag}</div>}
      </div>
    </div>
  );
}
