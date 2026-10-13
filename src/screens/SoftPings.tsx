import { ping48230, pingGuardrails, type SoftPing } from '../data';
import { inr, pc } from '../format';
import { useStore } from '../store';
import { Button, Card, Chip, ExpectedLossLabel, SectionTitle, WhatsAppBubble, cx } from '../components/ui';

const statusChip = (p: SoftPing) => {
  switch (p.status) {
    case 'awaiting':
      return <Chip tone="amber">Awaiting reply</Chip>;
    case 'closed':
      return <Chip tone="green">Yes, received</Chip>;
    case 'confirmed_late':
      return <Chip tone="red">Not yet</Chip>;
    case 'noreply':
      return <Chip tone="grey">No reply (7h)</Chip>;
    case 'noreply_scheduled':
      return <Chip tone="grey">No reply (24h)</Chip>;
  }
};

export function SoftPings() {
  const { state, dispatch } = useStore();
  const sel = state.pings.find((p) => p.id === state.selectedPing) ?? state.pings[0];

  return (
    <div>
      <SectionTitle sub="When a parcel looks late but the customer hasn’t complained, Pre-empt asks before it spends. Cost ₹0.">Soft pings</SectionTitle>

      <div className="mb-6 flex flex-wrap gap-2">
        {pingGuardrails.map((g) => (
          <Chip key={g} tone="blue">
            ✓ {g}
          </Chip>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden" tour="pings-table">
            <div className="-mx-6 -my-6 overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 pl-6 pr-3">Order</th>
                    <th className="px-3 py-3 text-right">Value</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3">Signal</th>
                    <th className="px-3 py-3">Sent</th>
                    <th className="py-3 pl-3 pr-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.pings.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => dispatch({ type: 'selectPing', id: p.id })}
                      className={cx('cursor-pointer border-b border-slate-100 align-top transition-colors last:border-0', sel.id === p.id ? 'bg-blue-50/70' : 'hover:bg-slate-50')}
                    >
                      <td className="py-4 pl-6 pr-3">
                        <span className="whitespace-nowrap font-mono text-[13px] font-semibold text-primary">{p.id}</span>
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums">{inr(p.amount)}</td>
                      <td className="whitespace-nowrap px-3 py-4">{p.method}</td>
                      <td className="max-w-[280px] px-3 py-4 text-xs leading-snug text-slate-700">{p.signal}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-600">{p.sent}</td>
                      <td className="max-w-[220px] py-4 pl-3 pr-6">
                        {statusChip(p)}
                        {p.statusText && <div className="mt-1 text-[11px] leading-snug text-slate-500">{p.statusText}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {sel.id === 'ORD-48230' && (
            <Card title="ORD-48230 · why a ping, not money">
              <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                <Stat label="Dispute risk" value={pc(ping48230.pDispute)} />
                <Stat label="Win chance if disputed" value={pc(ping48230.pWin)} />
                <Stat label={<ExpectedLossLabel text="Expected loss, no action" />} value={inr(ping48230.costDoNothing)} />
                <Stat label={<ExpectedLossLabel text="Expected loss, soft ping" />} value={inr(ping48230.costWithPing)} accent />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Below the 50% dispute-risk threshold for a proactive message, but the transit anomaly is real. A ₹0 neutral question resolves the
                uncertainty first.
              </p>
            </Card>
          )}

          {state.presenter && (
            <p className="text-sm font-medium text-slate-700">Each reply is a label in minutes, so the model learns without waiting 90 days for a dispute.</p>
          )}
        </div>

        <div className="min-w-0">
          <Phone ping={sel} mockLabel={state.presenter} />
          {state.presenter && sel.id === 'ORD-48230' && (
            <div className="mt-6 rounded-card border-2 border-dashed border-slate-300 bg-[repeating-linear-gradient(135deg,#f8fafc_0,#f8fafc_8px,#f1f5f9_8px,#f1f5f9_16px)] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span aria-hidden>⚙</span> Demo control: simulate the customer&rsquo;s reply
              </div>
              <div className="grid gap-2">
                <Button variant="secondary" disabled={sel.status !== 'awaiting'} onClick={() => dispatch({ type: 'pingReply', id: sel.id, reply: 'yes' })}>
                  Yes, received
                </Button>
                <Button variant="secondary" disabled={sel.status !== 'awaiting'} onClick={() => dispatch({ type: 'pingReply', id: sel.id, reply: 'notyet' })}>
                  Not yet
                </Button>
                <Button variant="secondary" disabled={sel.status !== 'awaiting'} onClick={() => dispatch({ type: 'pingReply', id: sel.id, reply: 'noreply' })}>
                  No reply (24h)
                </Button>
              </div>
              {sel.status !== 'awaiting' && (
                <p className="mt-3 text-xs text-slate-500">
                  Reply recorded.{' '}
                  {sel.status === 'confirmed_late' && (
                    <button className="font-medium text-primary hover:underline" onClick={() => dispatch({ type: 'nav', screen: 'queue' })}>
                      Open review queue →
                    </button>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: React.ReactNode; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-[11px] leading-snug text-slate-500">{label}</div>
      <div className={cx('mt-0.5 text-lg font-semibold tabular-nums', accent ? 'text-ok' : 'text-slate-900')}>{value}</div>
    </div>
  );
}

function Phone({ ping, mockLabel }: { ping: SoftPing; mockLabel: boolean }) {
  const name = ping.customer ?? 'there';
  const num = ping.id.replace('ORD-', '');
  const sentTime = ping.sent.replace(' today', '');
  return (
    <figure className="mx-auto w-full max-w-[300px]">
      <figcaption className="mb-2 text-center text-xs font-medium text-slate-500">WhatsApp Business message{mockLabel ? ' (mock)' : ''}</figcaption>
      <div className="rounded-[36px] border-[10px] border-navy bg-navy shadow-xl">
        <div className="overflow-hidden rounded-[26px] bg-[#ECE5DD]">
          <div className="flex items-center gap-2 bg-[#075E54] px-4 pb-2.5 pt-5 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">FT</div>
            <div>
              <div className="text-sm font-semibold">Fashion Tales</div>
              <div className="text-[10px] text-white/70">Business account</div>
            </div>
          </div>
          <div className="min-h-[200px] space-y-2 px-3 py-4">
            <div className="mx-auto w-fit rounded-md bg-white/70 px-2 py-0.5 text-[10px] text-slate-500">Today</div>
            <WhatsAppBubble from="in" tag={sentTime}>
              Hi {name}, quick check: has your Fashion Tales order #{num} arrived?
              {ping.status === 'awaiting' && (
                <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2">
                  <span className="rounded-md bg-slate-50 py-1 text-center text-[12px] font-medium text-[#128C7E]">Yes, received</span>
                  <span className="rounded-md bg-slate-50 py-1 text-center text-[12px] font-medium text-[#128C7E]">Not yet</span>
                </div>
              )}
            </WhatsAppBubble>
            {ping.reply && (
              <div className="fade-in">
                <WhatsAppBubble from="out" tag={ping.replyTime}>
                  {ping.reply}
                </WhatsAppBubble>
              </div>
            )}
            {ping.status === 'noreply' && <div className="text-center text-[11px] italic text-slate-500">No reply yet (7h) · status message at 09:40 tomorrow</div>}
            {ping.status === 'noreply_scheduled' && (
              <div className="fade-in text-center text-[11px] italic text-slate-500">No reply in 24h (simulated) · neutral status message scheduled</div>
            )}
            {ping.status === 'confirmed_late' && (
              <div className="fade-in text-center text-[11px] italic text-slate-500">Moved to review queue · merchant decides on any credit</div>
            )}
            {ping.status === 'closed' && <div className="fade-in text-center text-[11px] italic text-slate-500">Closed at ₹0 · courier scan marked stale</div>}
          </div>
        </div>
      </div>
    </figure>
  );
}
