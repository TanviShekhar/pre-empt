import { inr } from '../format';
import { useStore } from '../store';
import { Card, Chip, SectionTitle, cx } from '../components/ui';

export function AuditLog() {
  const { state } = useStore();
  const rows = [...state.audit].reverse();
  return (
    <div>
      <SectionTitle sub="Every automatic action, merchant decision, customer reply and override, Tue 6 Oct 2026 (IST).">Audit log</SectionTitle>
      <Card className="overflow-hidden">
        <div className="-mx-6 -my-6 overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 pl-6 pr-3">Time</th>
                <th className="px-3 py-3">Actor</th>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Why</th>
                <th className="px-3 py-3">
                  Decided by
                  <span className="block text-[10px] font-medium normal-case tracking-normal text-slate-400">and method used</span>
                </th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="py-3 pl-3 pr-6">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={`${a.time}-${i}-${a.action}`} className={i < state.audit.length - 6 ? 'fade-in border-b border-slate-100 align-top' : 'border-b border-slate-100 align-top last:border-0'}>
                  <td className="py-3 pl-6 pr-3 tabular-nums text-slate-600">{a.time}</td>
                  <td className="px-3 py-3">
                    <Chip tone={a.actor === 'Merchant' ? 'blue' : a.actor === 'Customer' ? 'amber' : 'grey'}>{a.actor}</Chip>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-[13px]">{a.order}</td>
                  <td className="px-3 py-3 text-slate-800">{a.action}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{a.why}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    <div className="whitespace-nowrap">{state.presenter ? a.decidedBy : a.decidedBy.replace(' (synthetic)', '')}</div>
                    {a.method && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {a.method.split(' · ').map((m) => (
                          <span
                            key={m}
                            className={cx(
                              'rounded px-1.5 py-px text-[10px] font-semibold',
                              m === 'Rule' ? 'bg-slate-100 text-slate-600' : m === 'Statistics' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700',
                            )}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{a.amount === null ? '—' : inr(a.amount)}</td>
                  <td className="py-3 pl-3 pr-6 font-mono text-[12px] text-slate-500">{a.paymentId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
