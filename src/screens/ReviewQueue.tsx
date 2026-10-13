import { useState, type ReactNode } from 'react';
import { contextSignals, type QueueOrder } from '../data';
import { inr, pc } from '../format';
import {
  actionLabel,
  doneLabel,
  isOptionBlocked,
  noneOf,
  pendingCount,
  queueSortLabels,
  recOf,
  useStore,
  visibleQueue,
  zeroMoneyPending,
  type QueueFilter,
  type QueueRow,
  type QueueSort,
} from '../store';
import { ActByChip, EditDrawer, LossFigure, RiskAbuseChip, SkipButton, SourceTag, UnblockLink } from '../components/QueueActions';
import { Button, Card, Chip, ExpectedLossLabel, RiskChip, SectionTitle, Tooltip, cx } from '../components/ui';

export function ReviewQueue() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<QueueOrder | null>(null);
  const zero = zeroMoneyPending(state).length;
  const pending = pendingCount(state);
  const rows = visibleQueue(state);
  const counts: Record<QueueFilter, number> = { all: state.queue.length, pending, done: state.queue.length - pending };
  const filters: { id: QueueFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Needs review' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <div>
      <SectionTitle
        sub={
          state.presenter
            ? 'Orders above your auto-approve thresholds. Nothing involving money happens without you. Same review you already do for flagged COD orders in Magic Checkout, now for prepaid orders after they ship.'
            : 'Orders above your auto-approve thresholds. Nothing involving money happens without you.'
        }
      >
        Review queue
      </SectionTitle>

      {state.paused && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Agent is paused. Approvals are disabled until you resume.
        </div>
      )}

      {pending === 0 && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-ok">All clear.</div>
              <p className="mt-0.5 text-sm text-slate-600">No orders need you right now. Pre-empt will alert you when an order crosses your thresholds.</p>
            </div>
            <button onClick={() => dispatch({ type: 'nav', screen: 'audit' })} className="text-sm font-medium text-primary hover:underline">
              See what Pre-empt handled automatically →
            </button>
          </div>
        </Card>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Filter by status">
            {filters.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={state.queueFilter === f.id}
                onClick={() => dispatch({ type: 'setQueueFilter', filter: f.id })}
                className={cx(
                  'rounded-md px-3 py-1 text-xs font-medium transition',
                  state.queueFilter === f.id ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {f.label} <span className="tabular-nums opacity-70">({counts[f.id]})</span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
            Sort by
            <select
              value={state.queueSort}
              onChange={(e) => dispatch({ type: 'setQueueSort', sort: e.target.value as QueueSort })}
              className="rounded-lg border border-slate-300 bg-white py-1 pl-2.5 pr-7 text-xs font-medium text-slate-800 focus:border-primary focus:outline-none"
            >
              {(Object.keys(queueSortLabels) as QueueSort[]).map((k) => (
                <option key={k} value={k}>
                  {queueSortLabels[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {zero > 0 && (
          <Tooltip content="Money-moving actions always need one-by-one review." width={240}>
            <Button variant="secondary" size="sm" disabled={state.paused} onClick={() => dispatch({ type: 'approveZeroMoney' })}>
              Approve all ₹0 actions ({zero})
            </Button>
          </Tooltip>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="-mx-6 -my-6 overflow-x-auto" data-tour="queue-table">
          <table className="w-full min-w-[960px] table-fixed text-sm">
            <colgroup>
              <col style={{ width: 104 }} />
              <col />
              <col style={{ width: 120 }} />
              <col style={{ width: 112 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 136 }} />
              <col style={{ width: 104 }} />
              <col style={{ width: 146 }} />
            </colgroup>
            <thead>
              {/* All headers are vertically centred and wrap to at most two lines, so they line up */}
              <tr className="border-b border-slate-200 text-left align-middle text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-500">
                <th className="py-3 pl-6 pr-2">Order</th>
                <th className="px-2 py-3">Signals</th>
                <th className="px-2 py-3 text-center">
                  <SortHeader sort="value">Amount</SortHeader>
                </th>
                <th className="px-2 py-3">
                  <SortHeader sort="risk">Dispute risk</SortHeader>
                </th>
                <th className="px-2 py-3 text-center">
                  Win chance
                  <br />
                  if disputed
                </th>
                <th className="px-2 py-3">
                  Recommended
                  <br />
                  action
                </th>
                <th className="px-2 py-3 text-center">
                  <ExpectedLossLabel className="font-bold text-slate-700" />
                </th>
                <th className="py-3 pl-2 pr-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Row key={row.order.id} row={row} onEdit={() => setEditing(row.order)} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">
                    {state.queueFilter === 'done' ? 'Nothing approved or skipped yet.' : 'No orders need review.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 max-w-4xl text-xs leading-relaxed text-slate-500">
        Refunds and credits are issued as Razorpay refunds against the payment ID. If a dispute still arrives, Pre-empt submits the refund
        record as evidence (counters &lsquo;Credit Not Processed&rsquo;). The bank still decides.
      </p>

      {editing && <EditDrawer order={editing} open={!!editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

/** Column header that doubles as a sort shortcut, with an arrow when that sort is active. */
function SortHeader({ sort, children }: { sort: QueueSort; children: ReactNode }) {
  const { state, dispatch } = useStore();
  const active = state.queueSort === sort;
  return (
    <button
      onClick={() => dispatch({ type: 'setQueueSort', sort })}
      title={`Sort by ${queueSortLabels[sort].toLowerCase()}`}
      className={cx('inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-800', active && 'text-primary')}
    >
      {children}
      <span aria-hidden className={cx('text-[10px]', active ? 'opacity-100' : 'opacity-30')}>
        ↓
      </span>
    </button>
  );
}

function Row({ row, onEdit }: { row: QueueRow; onEdit: () => void }) {
  const { state, dispatch } = useStore();
  const o = row.order;
  const rec = recOf(o);
  const chosen = o.options.find((x) => x.id === row.optionId);
  const doNothing = noneOf(o);
  const open = () => dispatch({ type: 'nav', screen: 'order', orderId: o.id });
  const blocked = o.options.filter((x) => isOptionBlocked(state, o.id, x));
  const muted = row.status === 'skipped';

  return (
    <tr
      onClick={open}
      className={cx(
        'cursor-pointer border-b border-slate-100 align-top transition-colors last:border-0',
        row.status === 'approved' && 'bg-green-50 hover:bg-green-100/60',
        row.status === 'skipped' && 'bg-slate-50 text-slate-400 hover:bg-slate-100',
        row.status === 'pending' && 'hover:bg-slate-50',
        row.isNew && row.status === 'pending' && 'row-new',
      )}
    >
      {/* Order */}
      <td className="py-4 pl-6 pr-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="whitespace-nowrap font-mono text-[13px] font-semibold text-primary hover:underline"
        >
          {o.id}
        </button>
        {/* non-breaking space before the dot so long methods wrap after it */}
        <div className="mt-0.5 text-xs leading-snug text-slate-500">{o.method.replace(' · ', ' · ')}</div>
        {row.isNew && (
          <Chip tone="amber" wrap className="mt-1.5 text-[11px]">
            New · from soft ping
          </Chip>
        )}
      </td>

      {/* Signals */}
      <td className="px-2 py-4">
        <ul className="space-y-1.5">
          {o.quickSignals.map((s, i) => (
            <li key={s} className="flex gap-2">
              <span
                className={cx('mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full', muted ? 'bg-slate-300' : contextSignals.has(s) ? 'bg-slate-400' : 'bg-risk')}
                aria-hidden
              />
              <Tooltip content={o.signals[i] ?? s} width={280}>
                <span className={cx('text-[13px] leading-snug', muted ? 'text-slate-400' : 'text-slate-700')}>{s}</span>
              </Tooltip>
            </li>
          ))}
        </ul>
        {(o.riskChip || o.reviewReason) && (
          <div className="mt-2 space-y-1">
            {o.riskChip && (
              <>
                <RiskAbuseChip order={o} />
                <div>
                  <UnblockLink order={o} />
                </div>
              </>
            )}
            {o.reviewReason && (
              <Chip tone="grey" wrap className="text-[11px]">
                {o.reviewReason}
              </Chip>
            )}
          </div>
        )}
      </td>

      {/* Amount */}
      <td className="px-2 py-4 text-center">
        <div className="font-semibold tabular-nums text-slate-900">{inr(o.amount)}</div>
        <ActByChip order={o} stacked className="mx-auto mt-1.5 max-w-[104px]" />
      </td>

      {/* Dispute risk */}
      <td className="px-2 py-4">
        <RiskChip p={o.pDispute} />
      </td>

      {/* Win chance */}
      <td className="px-2 py-4 text-center tabular-nums">{pc(o.pWin)}</td>

      {/* Recommended action: tag / action / note */}
      <td className="px-2 py-4">
        <SourceTag source={o.source} />
        <div className="mt-1 text-[13px] font-medium leading-snug text-slate-800">{o.recommendedLabel}</div>
        {o.note && <div className="mt-1 text-[11px] leading-snug text-ok">{o.note}</div>}
        {blocked.map((x) => (
          <div key={x.id} className="mt-1 text-[11px] leading-snug text-slate-500">
            <span className="line-through">{x.label}</span> <span className="font-medium text-risk">🔒 {x.disabledReason}</span>
          </div>
        ))}
      </td>

      {/* Expected loss */}
      <td className="px-2 py-4 text-center">
        <LossFigure opt={chosen ?? rec} strong />
        {doNothing !== rec && !chosen && <div className="mt-0.5 whitespace-nowrap text-[11px] text-slate-400">vs {inr(doNothing.expectedCost)} no action</div>}
      </td>

      {/* Actions */}
      <td className="py-4 pl-2 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
        {row.status === 'pending' && (
          <div className="ml-auto flex w-[120px] flex-col gap-1.5">
            <Button
              size="sm"
              className="w-full !px-2"
              disabled={state.paused}
              title={state.paused ? 'Agent is paused' : undefined}
              onClick={() => dispatch({ type: 'approve', orderId: o.id, optionId: rec.id })}
            >
              {actionLabel(rec.kind)}
            </Button>
            <div className="flex items-center justify-between gap-1.5">
              <Button size="sm" variant="secondary" className="flex-1" onClick={onEdit}>
                Edit
              </Button>
              <SkipButton orderId={o.id} grow />
            </div>
          </div>
        )}
        {row.status === 'approved' && chosen && (
          <div className="flex flex-col items-end">
            <Chip tone="green" wrap className="text-right">
              ✓ {doneLabel(chosen.kind)} {row.time}
            </Chip>
            {chosen.id !== rec.id && <div className="mt-1 text-[11px] text-slate-500">Edited: {chosen.label}</div>}
          </div>
        )}
        {row.status === 'skipped' && (
          <div className="flex flex-col items-end">
            <Chip tone="grey">Skipped {row.time}</Chip>
            <div className="mt-1 text-[11px] text-slate-400">{row.skipReason}</div>
          </div>
        )}
      </td>
    </tr>
  );
}
