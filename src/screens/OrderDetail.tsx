import { useEffect, useState } from 'react';
import { isUPI, whyFlagged48213, type AiRow, type QueueOrder, type TimelineEvent } from '../data';
import { inr, pc, points } from '../format';
import { actionLabel, doneLabel, isOptionBlocked, recOf, useStore, type QueueRow } from '../store';
import { ActByChip, LossFigure, RiskAbuseChip, SkipButton, UnblockLink } from '../components/QueueActions';
import { Button, Card, CheckBurst, Chip, ExpectedLossLabel, InfoTip, RiskChip, Tooltip, WhatsAppBubble, cx } from '../components/ui';

export function OrderDetail() {
  const { state, dispatch } = useStore();
  const row = state.queue.find((r) => r.order.id === state.orderId) ?? state.queue[0];
  const o = row.order;
  const rec = recOf(o);
  const meta = [o.method, o.firstOrder ? 'first order' : null, o.customer, o.product ? `“${o.product}”` : null].filter(Boolean).join(' · ');

  return (
    <div>
      <button onClick={() => dispatch({ type: 'nav', screen: 'queue' })} className="mb-3 text-sm font-medium text-primary hover:underline">
        ← Review queue
      </button>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-mono text-2xl font-semibold text-slate-900">{o.id}</h1>
        <span className="text-lg font-semibold tabular-nums">{inr(o.amount)}</span>
        <span className="text-sm text-slate-600">{meta}</span>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <RiskChip p={o.pDispute} suffix="dispute risk" />
        <Chip tone="grey">Win chance {pc(o.pWin)}</Chip>
        <Chip tone="blue">{isUPI(o) ? 'January: no effect (UPI)' : `January: ${points(rec.janImpact)} if approved`}</Chip>
        <ActByChip order={o} />
        {o.riskChip && (
          <>
            <RiskAbuseChip order={o} />
            <UnblockLink order={o} />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(340px,380px)]">
        <Timeline row={row} />
        <div className="min-w-0 space-y-5">
          <WhyFlagged order={o} />
        </div>
        <div data-tour="choose-action" className="min-w-0">
          <ChooseAction row={row} />
        </div>
      </div>
    </div>
  );
}

const toneDot: Record<NonNullable<TimelineEvent['tone']>, string> = {
  default: 'bg-slate-300',
  warn: 'bg-warn',
  flag: 'bg-risk',
  ok: 'bg-ok',
};

function Timeline({ row }: { row: QueueRow }) {
  const { state, dispatch } = useStore();
  const o = row.order;
  const chosen = o.options.find((x) => x.id === row.optionId);
  // Fast-forward and its simulated outcome are demo-only
  const ff = state.presenter && state.fastForwarded[o.id];
  const canFF = state.presenter && o.id === 'ORD-48213' && row.status === 'approved';

  return (
    <Card title="Timeline">
      <ol className="relative ml-1.5 border-l border-slate-200">
        {o.timeline.map((e, i) => (
          <Event key={i} e={e} />
        ))}
        {row.status === 'approved' && chosen && (
          <Event e={{ when: `Tue 6 Oct ${row.time}`, text: `Merchant approved: ${chosen.approvedText ?? chosen.label.toLowerCase()}`, tone: 'ok' }} fresh />
        )}
        {row.status === 'skipped' && <Event e={{ when: `Tue 6 Oct ${row.time}`, text: `Merchant skipped · ${row.skipReason}` }} fresh />}
        {ff && (
          <li className="fade-in mb-1 ml-5 mt-4">
            <Chip tone="amber">Simulated outcome</Chip>
          </li>
        )}
        {ff && whyFlagged48213.fastForward.map((e, i) => <Event key={`ff${i}`} e={e} fresh simulated />)}
      </ol>
      {canFF && !ff && (
        <button
          onClick={() => dispatch({ type: 'fastForward', orderId: o.id })}
          className="fade-in mt-4 flex w-full flex-col items-center rounded-lg px-3 py-2 text-center ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50"
        >
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-primary">
              <path d="M3 5.5v13l8.5-6.5L3 5.5zm9 0v13l8.5-6.5L12 5.5z" />
            </svg>
            Fast-forward 2 days
          </span>
          <span className="text-[11px] text-slate-500">(simulated)</span>
        </button>
      )}
    </Card>
  );
}

function Event({ e, fresh, simulated }: { e: TimelineEvent; fresh?: boolean; simulated?: boolean }) {
  if (e.muted)
    return (
      <li className="relative -mt-2 mb-4 ml-5 text-[12px] italic leading-snug text-slate-500">
        {e.text}
      </li>
    );
  return (
    <li className={cx('relative mb-4 ml-5 last:mb-0', fresh && 'fade-in')}>
      <span
        className={cx(
          'absolute -left-[25.5px] top-0 mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white',
          toneDot[e.tone ?? 'default'],
          simulated && 'border border-dashed border-amber-500 bg-white',
        )}
      />
      <div className="text-[11px] font-medium tabular-nums text-slate-500">{e.when}</div>
      <div className={cx('text-[13px] leading-snug', simulated ? 'italic text-slate-600' : 'text-slate-800')}>{e.text}</div>
    </li>
  );
}

function WhyFlagged({ order }: { order: QueueOrder }) {
  let cum = 0;
  const rows = order.riskItems.map((it) => {
    const start = it.value >= 0 ? cum : cum + it.value;
    cum += it.value;
    return { ...it, start };
  });
  const scale = (v: number) => `${v * 100}%`;
  const is48213 = order.id === 'ORD-48213';
  const { state } = useStore();

  return (
    <>
      <div data-tour="why-flagged">
      <Card
        title={
          <Tooltip
            width={300}
            content="Each bar shows how much a signal moved this order’s dispute risk from the base rate. The bars add up to the order’s dispute risk."
          >
            <span tabIndex={0} className="cursor-help border-b border-dotted border-slate-400">
              Why flagged
            </span>
          </Tooltip>
        }
        right={
          <span className="flex items-center whitespace-nowrap text-xs text-slate-500">
            How the risk adds up
            {/* clean mode: the method note becomes a hover icon instead of a caption */}
            {!state.presenter && order.riskCaption && <InfoTip content={order.riskCaption} width={280} />}
          </span>
        }
      >
        <div className="cq space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="risk-row items-center">
              <div className="risk-label text-[12.5px] leading-snug text-slate-700">
                {r.label}
                {r.note && <div className="text-[11px] italic text-slate-500">{r.note}</div>}
              </div>
              <div className="relative h-5 rounded bg-slate-50">
                <div
                  className={cx('bar-grow absolute inset-y-0 rounded', r.base ? 'bg-slate-400' : r.value > 0 ? 'bg-red-400' : 'bg-green-500')}
                  style={{ left: scale(r.start), width: scale(Math.abs(r.value)) }}
                />
              </div>
              <div className={cx('text-right text-[13px] font-semibold tabular-nums', r.base ? 'text-slate-600' : r.value > 0 ? 'text-risk' : 'text-ok')}>
                {r.base ? pc(r.value) : `${r.value > 0 ? '+' : '−'}${pc(Math.abs(r.value))}`}
              </div>
            </div>
          ))}
          <div className="risk-row items-center border-t border-slate-200 pt-2.5">
            <div className="risk-label text-[13px] font-semibold text-slate-900">Dispute risk</div>
            <div className="relative h-5 rounded bg-slate-50">
              <div className="bar-grow absolute inset-y-0 left-0 rounded bg-navy" style={{ width: scale(order.pDispute) }} />
            </div>
            <div className="text-right text-[15px] font-bold tabular-nums text-slate-900">{pc(order.pDispute)}</div>
          </div>
        </div>
        {state.presenter && order.riskCaption && <p className="mt-3 text-[11px] text-slate-500">{order.riskCaption}</p>}
      </Card>
      </div>

      {is48213 ? (
        <Card title="Why the win chance is only 28%">
          <ul className="space-y-1.5 text-[13px] text-slate-700">
            {whyFlagged48213.winReasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-risk">✕</span>
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-900">ⓘ {whyFlagged48213.promiseNote}</p>
        </Card>
      ) : (
        <Card title="Signals">
          <ul className="space-y-2 text-[13px] text-slate-700">
            {order.signals.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-risk" />
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Win chance if disputed: {pc(order.pWin)}.</p>
          {order.note && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-800">{order.note}</p>}
          {order.reviewReason && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">Shown in the queue because {order.reviewReason.toLowerCase()}.</p>
          )}
        </Card>
      )}

      {/* pitch material: in clean mode this detail lives in the Audit log's Method line */}
      {state.presenter && <AiBox rows={order.ai} />}
    </>
  );
}

const aiKindLabel: Record<AiRow['kind'], string> = {
  Rules: 'Rules (no AI needed)',
  Statistics: 'Statistics',
  Model: 'Model (machine learning)',
  'Language model': 'Language model',
};

function AiBox({ rows }: { rows: AiRow[] }) {
  return (
    <Card title="What’s AI here, and what’s a rule">
      <dl className="cq divide-y divide-slate-100 text-[12.5px]">
        {rows.map((r) => (
          <div key={r.kind} className="ai-row py-2">
            <dt className={cx('flex items-center gap-2 font-semibold', r.used ? 'text-slate-800' : 'text-slate-400')}>
              {aiKindLabel[r.kind]}
            </dt>
            <dd className={cx('flex flex-wrap items-start gap-2', r.used ? 'text-slate-700' : 'text-slate-400')}>
              <span
                className={cx(
                  'shrink-0 rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider',
                  r.used ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400',
                )}
              >
                {r.used ? 'Used' : 'Not used'}
              </span>
              <span className="min-w-0 flex-1">{r.text}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function NextBox({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">What happens next</div>
      <p className="mt-1 text-[12.5px] leading-snug text-slate-700">{text}</p>
    </div>
  );
}

function ChooseAction({ row }: { row: QueueRow }) {
  const { state, dispatch } = useStore();
  const o = row.order;
  const rec = recOf(o);
  const [sel, setSel] = useState(rec.id);
  const [editingMsg, setEditingMsg] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => {
    setSel(rec.id);
    setEditingMsg(false);
  }, [o.id, rec.id]);

  const opt = o.options.find((x) => x.id === sel)!;
  const msg = draft[opt.id] ?? opt.message;
  const chosen = o.options.find((x) => x.id === row.optionId);

  if (row.status === 'approved' && chosen) {
    return (
      <Card title="Action">
        <div className="flex flex-col items-center py-4 text-center">
          <CheckBurst size={64} />
          <div className="mt-3 text-base font-semibold text-ok">
            {doneLabel(chosen.kind)} {row.time}
          </div>
          <div className="mt-1 text-sm text-slate-700">{chosen.label}</div>
          <div className="mt-3 text-xs text-slate-500">
            Dispute risk {pc(o.pDispute)} → {chosen.pAfter === null ? '—' : pc(chosen.pAfter)}
            {chosen.pWinAfter ? ` · Win chance → ${pc(chosen.pWinAfter)}` : ''} · <ExpectedLossLabel /> {chosen.displayLoss ? chosen.displayLoss.main : inr(chosen.expectedCost)}
          </div>
          {chosen.refundAmount ? (
            <div className="mt-2 text-xs text-slate-500">
              {inr(chosen.refundAmount)} issued as a Razorpay {chosen.refundAmount < o.amount ? 'partial ' : ''}refund against {o.paymentId}
              {state.presenter ? ' (synthetic)' : ''}.
            </div>
          ) : null}
        </div>
        {(draft[chosen.id] ?? chosen.message) && (
          <div className="rounded-lg bg-[#ECE5DD] p-3">
            <WhatsAppBubble tag={`Sent ${row.time} ✓✓`}>{draft[chosen.id] ?? chosen.message}</WhatsAppBubble>
          </div>
        )}
        <NextBox text={o.next} />
        <Button variant="secondary" className="mt-4 w-full" onClick={() => dispatch({ type: 'nav', screen: 'overview' })}>
          See January projection on Overview →
        </Button>
      </Card>
    );
  }

  if (row.status === 'skipped') {
    return (
      <Card title="Action">
        <div className="py-6 text-center">
          <Chip tone="grey">Skipped {row.time}</Chip>
          <p className="mt-2 text-sm text-slate-600">{row.skipReason}</p>
          <p className="mt-2 text-xs text-slate-500">Logged as a merchant override. No action sent.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Choose an action">
      <div className="space-y-2">
        {o.options.map((x) => {
          const disabled = isOptionBlocked(state, o.id, x);
          const active = sel === x.id;
          const barPct = Math.min(100, (x.expectedCost / o.amount) * 100);
          return (
            <button
              key={x.id}
              disabled={disabled}
              onClick={() => {
                setSel(x.id);
                setEditingMsg(false);
              }}
              className={cx(
                'w-full rounded-lg border p-3 text-left transition',
                disabled && 'cursor-not-allowed border-dashed border-slate-200 bg-slate-50 opacity-70',
                !disabled && active && 'border-primary bg-blue-50 ring-1 ring-primary',
                !disabled && !active && x.recommended && 'border-blue-300 bg-blue-50/40',
                !disabled && !active && !x.recommended && 'border-slate-200 hover:border-slate-300',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900">{x.label}</div>
                  {x.recommended && <Chip tone="blue" className="mt-1">Recommended</Chip>}
                </div>
                <div className="shrink-0 text-right text-[13px]">
                  <ExpectedLossLabel className="text-[10px] font-medium uppercase tracking-wider text-slate-400" />
                  <div className="mt-0.5">{disabled ? <span className="text-slate-400">—</span> : <LossFigure opt={x} />}</div>
                </div>
              </div>
              {!disabled && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  <div className={cx('h-full rounded-full', x.recommended ? 'bg-primary' : 'bg-slate-400')} style={{ width: `${barPct}%` }} />
                </div>
              )}
              <div className="mt-1.5 text-[11.5px] text-slate-500">
                {disabled ? (
                  <span className="font-medium text-risk">🔒 {x.disabledReason}</span>
                ) : (
                  <>
                    Dispute risk after action: <b className="tabular-nums text-slate-700">{x.pAfter === null ? '—' : pc(x.pAfter)}</b>
                    {x.pWinAfter ? (
                      <>
                        {' '}
                        · Win chance <b className="text-slate-700">{pc(x.pWinAfter)}</b>
                      </>
                    ) : null}
                  </>
                )}
              </div>
              {x.recommended && active && <p className="mt-2 text-[12px] leading-snug text-blue-900">{o.recommendationReason}</p>}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Bars show expected loss as a share of the {inr(o.amount)} order value.</p>

      {msg ? (
        <div className="mt-4">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-xs font-semibold text-slate-700">Message preview</span>
            <Chip tone="green" wrap>Merchant-approved template · no urgency, no scarcity</Chip>
          </div>
          <div className="rounded-lg bg-[#ECE5DD] p-3">
            {editingMsg ? (
              <textarea
                className="h-28 w-full rounded-lg border border-slate-300 bg-white p-2 text-[13px] focus:border-primary focus:outline-none"
                value={msg}
                onChange={(e) => setDraft({ ...draft, [opt.id]: e.target.value })}
              />
            ) : (
              <WhatsAppBubble tag={draft[opt.id] ? 'Edited · to be sent on approval' : 'To be sent on approval'}>{msg}</WhatsAppBubble>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No customer message for this option.</p>
      )}

      {opt.refundAmount ? (
        <p className="mt-2 text-xs text-slate-500">
          {inr(opt.refundAmount)} issued as a Razorpay {opt.refundAmount < o.amount ? 'partial ' : ''}refund against {o.paymentId}
          {state.presenter ? ' (synthetic)' : ''}.
        </p>
      ) : null}

      {state.paused && <p className="mt-3 text-xs font-medium text-warn">Agent is paused. Resume to approve.</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          className="flex-1"
          disabled={state.paused || isOptionBlocked(state, o.id, opt)}
          onClick={() => {
            setEditingMsg(false);
            document.getElementById('main')?.scrollTo({ top: 0, behavior: 'smooth' });
            dispatch({ type: 'approve', orderId: o.id, optionId: opt.id, edited: opt.id !== rec.id || !!draft[opt.id] });
          }}
        >
          {actionLabel(opt.kind)}
        </Button>
        <Button
          variant="secondary"
          disabled={!opt.message}
          onClick={() => {
            if (editingMsg && draft[opt.id] && draft[opt.id] !== opt.message) dispatch({ type: 'messageEdited', orderId: o.id });
            setEditingMsg((v) => !v);
          }}
        >
          {editingMsg ? 'Done editing' : 'Edit message'}
        </Button>
        <SkipButton orderId={o.id} size="md" />
      </div>
      <div className="mt-3 flex items-center text-[11px] text-slate-400">
        Edits stay within approved templates
        <InfoTip content="Free-text edits are checked against template rules before sending: no urgency, no scarcity, no new offers beyond the selected action." />
      </div>
      <NextBox text={o.next} />
    </Card>
  );
}
