import { useEffect, useState } from 'react';
import { holdoutInfo, laneBaselines, neverAct, templates, type AuditEntry, type Lane, type ThresholdKey } from '../data';
import { inr } from '../format';
import { useStore, type Mode } from '../store';
import { Button, Card, Chip, InfoTip, Modal, SectionTitle, Toggle, WhatsAppBubble, cx } from '../components/ui';

const modes: { id: Mode; label: string }[] = [
  { id: 'recommend', label: 'Recommend-only' },
  { id: 'review', label: 'Review-first' },
  { id: 'auto', label: 'Auto within limits' },
];

const auditCsv =(audit: AuditEntry[]) => {
  const header = ['Time', 'Actor', 'Order', 'Action', 'Amount', 'Payment ID', 'Why', 'Decided by', 'Method'];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [
    header.join(','),
    ...audit.map((a) =>
      [`06-10-2026 ${a.time} IST`, a.actor, a.order, a.action, a.amount === null ? '' : String(a.amount), a.paymentId, a.why, a.decidedBy, a.method ?? ''].map(esc).join(','),
    ),
  ].join('\n');
};

const ChangedNote = ({ keys }: { keys: ThresholdKey[] }) => {
  const { state } = useStore();
  if (!keys.some((k) => state.changedSettings[k])) return null;
  return <div className="fade-in mt-1 text-[11px] font-medium text-primary">Applies to new recommendations from now. Logged.</div>;
};

export function Controls() {
  const { state, dispatch } = useStore();
  const [laneModal, setLaneModal] = useState<Lane | null>(null);
  const [laneVal, setLaneVal] = useState('');
  const [preview, setPreview] = useState<(typeof templates)[number] | null>(null);
  const [csvFallback, setCsvFallback] = useState<string | null>(null);
  const t = state.thresholds;
  const set = (key: ThresholdKey, value: number | boolean) => dispatch({ type: 'setThreshold', key, value });
  const mult = state.saleMode ? 2 : 1;

  const exportCsv = () => {
    const blob = new Blob(['﻿' + auditCsv(state.audit)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pre-empt-audit-log.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    dispatch({ type: 'exportAudit' });
  };

  const copyCsv = async () => {
    const csv = auditCsv(state.audit);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(csv);
      dispatch({ type: 'toast', text: `Audit log copied as CSV (${state.audit.length} rows).`, tone: 'info' });
    } catch {
      setCsvFallback(csv);
    }
  };

  return (
    <div>
      <SectionTitle
        sub={
          state.presenter
            ? 'You set the risk appetite. The model owns the inference.'
            : 'Choose when Pre-empt acts on its own, how much it can spend, and the rules it never breaks.'
        }
      >
        Controls
      </SectionTitle>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Card title="Mode">
            <div className="inline-flex flex-wrap rounded-lg bg-slate-100 p-1">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => dispatch({ type: 'setMode', mode: m.id })}
                  className={cx('rounded-md px-4 py-1.5 text-sm font-medium transition', state.mode === m.id ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900')}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {state.mode === 'auto' && (
              <p className="fade-in mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Auto-approve unlocks per action class after 50 approvals with fewer than 10% edits.
              </p>
            )}
            {state.paused && <p className="mt-3 text-sm font-medium text-slate-500">Agent is currently paused.</p>}
          </Card>

          <Card title="Automation thresholds" tour="thresholds">
            <div className="divide-y divide-slate-100 text-[13px] text-slate-700">
              <Rule on={t.softPingOn} onToggle={(v) => set('softPingOn', v)} title="Soft ping" keys={['softPingOn', 'softPingPct', 'softPingDispatchH']}>
                Auto when transit ≥ <Num k="softPingPct" w={52} />
                th percentile for the lane, no customer contact, dispatched over <Num k="softPingDispatchH" w={52} />h ago, once per order.
              </Rule>
              <Rule on={t.msgOn} onToggle={(v) => set('msgOn', v)} title="Proactive messages" keys={['msgOn', 'msgP', 'msgSignals']}>
                Auto when dispute risk ≥ <Num k="msgP" step={5} />% and <Num k="msgSignals" w={44} />+ corroborating signals (a soft-ping reply counts as a signal).
              </Rule>
              <Rule on={t.opsNudgeOn} onToggle={(v) => set('opsNudgeOn', v)} title="Ops nudges" keys={['opsNudgeOn']}>
                Dashboard alert; RAY on WhatsApp where enabled. Auto when the fulfilment SLA is breached.
              </Rule>
              <Rule
                on={t.creditOn}
                onToggle={(v) => set('creditOn', v)}
                keys={['creditOn', 'creditMax', 'creditP', 'creditWin']}
                title={
                  <>
                    Partial credit up to ₹<Num k="creditMax" step={50} w={64} />
                  </>
                }
                toggleLabel="Partial credit"
              >
                Auto when dispute risk ≥ <Num k="creditP" step={5} />% and win chance if disputed ≤ <Num k="creditWin" step={5} />%.
              </Rule>
              <Rule
                on={t.refundOn}
                onToggle={(v) => set('refundOn', v)}
                keys={['refundOn', 'refundMax', 'refundP', 'refundWin']}
                title={
                  <>
                    Refund up to ₹<Num k="refundMax" step={50} w={64} />
                  </>
                }
                toggleLabel="Refund"
              >
                Auto when dispute risk ≥ <Num k="refundP" step={5} />% and win chance if disputed ≤ <Num k="refundWin" step={5} />%.
              </Rule>
              <Rule on locked title="Refund above ₹500" keys={[]}>
                Always review.
              </Rule>
            </div>
          </Card>

          <Card title="Caps">
            <div className="space-y-4">
              <CapBar label="Daily" k="dailyCap" spent={state.spendToday} cap={t.dailyCap * mult} sub="Spent today" />
              <CapBar label="Weekly" k="weeklyCap" spent={state.spendWeek} cap={t.weeklyCap * mult} sub="Spent this week" />
              <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-slate-800">Sale mode x2</div>
                  <div className="text-xs text-slate-500">Doubles both caps during festive sales.</div>
                </div>
                <Toggle on={state.saleMode} onChange={() => dispatch({ type: 'toggleSaleMode' })} label="Sale mode" />
              </div>
              <p className="text-[11px] text-slate-500">Duplicate-charge refunds return money the customer never owed, so they do not count against caps.</p>
            </div>
          </Card>

          <Card title={<span className="flex items-center">Holdout<InfoTip content={holdoutInfo} width={300} /></span>}>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-semibold tabular-nums">10%</span>
              <p className="text-sm text-slate-600">{holdoutInfo}</p>
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Never take monetary action when" right={<Chip tone="grey">🔒 Locked</Chip>}>
            <ul className="divide-y divide-slate-100">
              {neverAct.map((r) => (
                <li key={r} className="flex items-center justify-between gap-4 py-2.5 text-[13px] text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="text-slate-400">🔒</span>
                    {r}
                  </span>
                  <Toggle on disabled label={r} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">These guardrails are always on and cannot be switched off from this dashboard.</p>
          </Card>

          <Card title={<span className="flex flex-wrap items-center gap-2">Lane baselines <Chip tone="grey">Model-managed · read-only</Chip></span>}>
            <div className="-mx-6 overflow-x-auto">
              <table className="w-full min-w-[460px] text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2 pl-6 pr-2">Lane</th>
                    <th className="px-2 py-2 text-right">Median</th>
                    <th className="px-2 py-2 text-right">90th pct</th>
                    <th className="px-2 py-2 text-right">96th pct</th>
                    <th className="px-2 py-2">This week vs normal</th>
                    <th className="py-2 pl-2 pr-6" />
                  </tr>
                </thead>
                <tbody>
                  {laneBaselines.map((l) => {
                    const ov = state.laneOverrides[l.lane];
                    return (
                      <tr key={l.lane} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 pl-6 pr-2 font-medium">{l.lane}</td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">{l.median.toFixed(1)} days</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">
                          {ov !== undefined ? (
                            <span>
                              <span className="text-slate-400 line-through">{l.p90.toFixed(1)}</span> <b className="text-warn">{ov.toFixed(1)}</b>
                            </span>
                          ) : (
                            l.p90.toFixed(1)
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{l.p96.toFixed(1)}</td>
                        <td className={cx('px-2 py-2.5', l.vsNormal.includes('festive') ? 'text-warn' : 'text-slate-600')}>{l.vsNormal}</td>
                        <td className="py-2.5 pl-2 pr-6 text-right">
                          <button
                            className="text-right text-xs font-medium leading-tight text-primary hover:underline"
                            onClick={() => {
                              setLaneVal((ov ?? l.p90).toFixed(1));
                              setLaneModal(l);
                            }}
                          >
                            Override (logged)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Approved message templates">
            <ul className="divide-y divide-slate-100">
              {templates.map((tp) => (
                <li key={tp.name} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="font-medium text-slate-800">{tp.name}</span>
                  <button className="text-xs font-medium text-primary hover:underline" onClick={() => setPreview(tp)}>
                    Preview
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Agent controls">
            <div className="flex flex-wrap gap-2">
              <Button variant={state.paused ? 'success' : 'danger-outline'} onClick={() => dispatch({ type: 'togglePause' })}>
                {state.paused ? 'Resume agent' : 'Pause agent'}
              </Button>
              <Button variant="secondary" disabled={state.mode === 'recommend'} onClick={() => dispatch({ type: 'setMode', mode: 'recommend' })}>
                Switch to recommend-only
              </Button>
              <Button variant="secondary" onClick={exportCsv}>
                Export audit log (CSV)
              </Button>
              <Button variant="secondary" onClick={copyCsv}>
                Copy as CSV
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={!!laneModal}
        onClose={() => setLaneModal(null)}
        title={`Override lane baseline · ${laneModal?.lane ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLaneModal(null)}>
              Cancel
            </Button>
            <Button
              disabled={!(parseFloat(laneVal) > 0)}
              onClick={() => {
                if (laneModal) dispatch({ type: 'laneOverride', lane: laneModal.lane, p90: parseFloat(laneVal) });
                setLaneModal(null);
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p>Overrides apply only to this lane and are recorded in the audit log. The model will flag if your override increases expected loss.</p>
        <label className="mt-4 block text-xs font-medium text-slate-600">
          90th percentile transit (days)
          <input
            type="number"
            step={0.1}
            min={0.5}
            value={laneVal}
            onChange={(e) => setLaneVal(e.target.value)}
            className="mt-1 block w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm tabular-nums focus:border-primary focus:outline-none"
          />
        </label>
        {laneModal && <p className="mt-2 text-xs text-slate-500">Model value: {laneModal.p90.toFixed(1)} days.</p>}
      </Modal>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={`Template · ${preview?.name ?? ''}`} footer={<Button onClick={() => setPreview(null)}>Close</Button>}>
        <div className="rounded-lg bg-[#ECE5DD] p-3">
          <WhatsAppBubble from="in" tag="Merchant-approved template">
            {preview?.body}
          </WhatsAppBubble>
        </div>
        <p className="mt-3 text-xs text-slate-500">Variables in braces are filled per order. No urgency, no scarcity, no offers beyond the approved action.</p>
      </Modal>

      <Modal open={csvFallback !== null} onClose={() => setCsvFallback(null)} title="Copy the audit log" footer={<Button onClick={() => setCsvFallback(null)}>Close</Button>}>
        <p className="mb-2 text-xs text-slate-500">Clipboard access isn&rsquo;t available here. Select the text below and copy it.</p>
        <textarea
          readOnly
          value={csvFallback ?? ''}
          onFocus={(e) => e.currentTarget.select()}
          className="h-56 w-full rounded-lg border border-slate-300 p-2 font-mono text-[11px] focus:border-primary focus:outline-none"
        />
      </Modal>
    </div>
  );
}

function Rule({
  title,
  children,
  on,
  onToggle,
  locked,
  keys,
  toggleLabel,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  on: boolean;
  onToggle?: (v: boolean) => void;
  locked?: boolean;
  keys: ThresholdKey[];
  toggleLabel?: string;
}) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className={cx('min-w-0 flex-1', !on && 'opacity-50')}>
        <div className="mb-0.5 font-semibold text-slate-900">
          {title} {locked && <span className="ml-1 text-xs font-normal text-slate-400">🔒</span>}
        </div>
        <div className="leading-relaxed">{children}</div>
        <ChangedNote keys={keys} />
      </div>
      <Toggle on={on} onChange={onToggle} disabled={locked} label={toggleLabel ?? (typeof title === 'string' ? title : 'Rule')} />
    </div>
  );
}

/** Number input that commits (and logs) on blur or Enter, not on every keystroke. */
function Num({ k, step = 1, w = 56 }: { k: ThresholdKey; step?: number; w?: number }) {
  const { state, dispatch } = useStore();
  const value = state.thresholds[k] as number;
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const v = parseFloat(draft);
    if (Number.isNaN(v) || v < 0) return setDraft(String(value));
    if (v !== value) dispatch({ type: 'setThreshold', key: k, value: v });
  };
  return (
    <input
      type="number"
      value={draft}
      step={step}
      min={0}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      style={{ width: w }}
      className="mx-0.5 inline-block rounded-md border border-slate-300 px-1.5 py-0.5 text-center text-[13px] tabular-nums focus:border-primary focus:outline-none"
    />
  );
}

function CapBar({ label, k, spent, cap, sub }: { label: string; k: ThresholdKey; spent: number; cap: number; sub: string }) {
  const pc = Math.min(100, (spent / cap) * 100);
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-slate-800">
          {label} ₹<Num k={k} step={500} w={84} />
        </span>
        <span className="text-xs text-slate-500">
          {sub}: <b className="tabular-nums text-slate-800">{inr(spent)}</b> of {inr(cap)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cx('h-full rounded-full transition-all duration-700', pc > 80 ? 'bg-warn' : 'bg-primary')} style={{ width: `${pc}%` }} />
      </div>
      <ChangedNote keys={[k]} />
    </div>
  );
}
