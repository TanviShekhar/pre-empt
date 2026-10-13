import { useEffect, useRef, useState } from 'react';
import { isUPI, skipReasons, type ActionOption, type QueueOrder } from '../data';
import { inr, pc, points } from '../format';
import { actionLabel, isOptionBlocked, recOf, useStore } from '../store';
import { Button, Chip, Drawer, ExpectedLossLabel, Tooltip, cx } from './ui';

export function SkipButton({ orderId, size = 'sm', disabled, grow }: { orderId: string; size?: 'sm' | 'md'; disabled?: boolean; grow?: boolean }) {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className={cx('relative inline-flex', grow && 'flex-1')} onClick={(e) => e.stopPropagation()}>
      <Button variant="secondary" size={size} className={grow ? 'w-full' : undefined} disabled={disabled} onClick={() => setOpen((o) => !o)}>
        Skip
      </Button>
      {open && (
        <div className="fade-in absolute right-0 top-full z-50 mt-1 w-60 rounded-lg border border-slate-200 bg-white p-1.5 text-left shadow-xl">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Why skip?</div>
          {skipReasons.map((r) => (
            <button
              key={r}
              onClick={() => {
                dispatch({ type: 'skip', orderId, reason: r });
                setOpen(false);
              }}
              className="block w-full rounded-md px-2.5 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Expected-loss figure as shown in the Edit drawer (always the raw ₹ figure). */
export function OptionCostCell({ opt }: { opt: ActionOption }) {
  return (
    <span>
      <span className="font-semibold tabular-nums">{inr(opt.expectedCost)}</span>
      {opt.costNote && <span className="block text-[11px] text-slate-500">{opt.costNote}</span>}
    </span>
  );
}

/** Expected-loss figure for the queue and detail page; duplicate refunds read "₹0 net loss". */
export function LossFigure({ opt, strong }: { opt: ActionOption; strong?: boolean }) {
  const weight = strong ? 'font-bold text-slate-900' : 'font-semibold';
  if (opt.displayLoss)
    return (
      <span>
        <span className={weight}>{opt.displayLoss.main}</span>
        <span className="block text-[11px] text-slate-500">{opt.displayLoss.sub}</span>
      </span>
    );
  return (
    <span>
      <span className={cx(weight, 'tabular-nums')}>{inr(opt.expectedCost)}</span>
      {opt.costNote && <span className="block text-[11px] text-slate-500">{opt.costNote}</span>}
    </span>
  );
}

const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden className="shrink-0">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

/**
 * "Act by" tag. `stacked` (queue) shows the urgency on line one and the reason on line two;
 * otherwise (detail header) it is a single line.
 */
export function ActByChip({ order, stacked, className }: { order: QueueOrder; stacked?: boolean; className?: string }) {
  const { when, reason, urgent } = order.actBy;
  const tone = urgent ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-slate-100 text-slate-600 ring-slate-200';
  if (!stacked)
    return (
      <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tone, className)}>
        <ClockIcon />
        <span className="font-semibold">{when}</span>
        {reason && <span className="font-normal opacity-80">· {reason}</span>}
      </span>
    );
  return (
    <span className={cx('block w-full rounded-md px-1.5 py-1 text-center ring-1 ring-inset', tone, className)}>
      <span className="block whitespace-nowrap text-[11px] font-semibold leading-tight">{when}</span>
      {reason && <span className="mt-0.5 block text-[10.5px] leading-tight opacity-80">{reason}</span>}
    </span>
  );
}

export function SourceTag({ source }: { source: QueueOrder['source'] }) {
  return (
    <Tooltip content="Rule: fixed logic, no AI needed. Model: predicted from signals." width={240}>
      <span
        tabIndex={0}
        className={cx(
          'mr-1.5 inline-flex cursor-help items-center rounded px-1.5 py-px align-[1px] text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset',
          source === 'Rule' ? 'bg-slate-100 text-slate-600 ring-slate-200' : 'bg-blue-50 text-blue-700 ring-blue-200',
        )}
      >
        {source}
      </span>
    </Tooltip>
  );
}

export function RiskAbuseChip({ order }: { order: QueueOrder }) {
  if (!order.riskChip) return null;
  return (
    <Tooltip content={order.riskChipTooltip} width={280}>
      <span tabIndex={0} className="cursor-help">
        <Chip tone="red" wrap>
          {order.riskChip}
        </Chip>
      </span>
    </Tooltip>
  );
}

export function UnblockLink({ order }: { order: QueueOrder }) {
  const { state, dispatch } = useStore();
  if (!order.riskChip) return null;
  if (state.unblocked[order.id]) return <span className="text-[11px] text-slate-500">Treated as a normal customer · logged</span>;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        dispatch({ type: 'unblock', orderId: order.id });
      }}
      className="text-left text-[11px] font-medium text-primary hover:underline"
    >
      Treat as a normal customer (logged)
    </button>
  );
}

export const janText = (order: QueueOrder, impact: number) => (isUPI(order) ? 'no effect (UPI)' : points(impact));

export function EditDrawer({ order, open, onClose }: { order: QueueOrder; open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const rec = recOf(order);
  const [sel, setSel] = useState(rec.id);
  useEffect(() => {
    if (open) setSel(rec.id);
  }, [open, rec.id]);
  const chosen = order.options.find((o) => o.id === sel)!;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <span>
          Edit action · <span className="font-mono text-sm">{order.id}</span>
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={state.paused || isOptionBlocked(state, order.id, chosen)}
            title={state.paused ? 'Agent is paused' : undefined}
            onClick={() => {
              dispatch({ type: 'approve', orderId: order.id, optionId: sel, edited: sel !== rec.id });
              onClose();
            }}
          >
            {sel === rec.id ? actionLabel(chosen.kind) : `Confirm: ${chosen.label.toLowerCase()}`}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Dispute risk {pc(order.pDispute)} · Win chance if disputed {pc(order.pWin)} · {inr(order.amount)} · {order.method}
      </p>
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <span>Option</span>
        <ExpectedLossLabel />
      </div>
      <div className="space-y-2">
        {order.options.map((o) => {
          const disabled = isOptionBlocked(state, order.id, o);
          return (
            <label
              key={o.id}
              className={cx(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                disabled ? 'cursor-not-allowed border-dashed border-slate-200 bg-slate-50 opacity-70' : 'cursor-pointer',
                !disabled && sel === o.id ? 'border-primary bg-blue-50 ring-1 ring-primary' : !disabled && 'border-slate-200 hover:border-slate-300',
              )}
            >
              <input type="radio" name="opt" className="mt-1 accent-primary" disabled={disabled} checked={sel === o.id} onChange={() => setSel(o.id)} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900">{o.label}</div>
                {o.recommended && <Chip tone="blue" className="mt-0.5">Recommended</Chip>}
                <div className="mt-0.5 text-xs text-slate-500">
                  {disabled ? (
                    <span className="font-medium text-risk">🔒 {o.disabledReason}</span>
                  ) : (
                    <>
                      Dispute risk after action {o.pAfter === null ? '—' : pc(o.pAfter)}
                      {o.pWinAfter ? ` · Win chance ${pc(o.pWinAfter)}` : ''} · January: {janText(order, o.janImpact)}
                    </>
                  )}
                </div>
              </div>
              <div className="text-right text-sm">{disabled ? <span className="text-slate-400">—</span> : <OptionCostCell opt={o} />}</div>
            </label>
          );
        })}
      </div>
      {state.paused && <p className="mt-4 text-sm font-medium text-warn">Agent is paused. Resume to confirm actions.</p>}
    </Drawer>
  );
}
