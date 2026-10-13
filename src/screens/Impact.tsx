import { useState } from 'react';
import { impact } from '../data';
import { inr } from '../format';
import { useStore } from '../store';
import { Card, Chip, InfoTip, SectionTitle, cx } from '../components/ui';

const HOLDOUT = '#64748B';
const TREATED = '#2563EB';

export function Impact() {
  const { state } = useStore();
  const [scenario, setScenario] = useState<'base' | 'conservative'>('base');
  const sc = impact.scenarios[scenario];
  const decided = state.queue.filter((r) => r.status !== 'pending').length;
  const overridePct = decided ? Math.round((state.overrides / decided) * 100) : 0;

  return (
    <div>
      <div className="mb-3">
        <Chip tone="amber">Illustrative · synthetic · pooled across merchants</Chip>
      </div>
      <SectionTitle sub="Pre-empt is measured against a holdout, so the effect is causal rather than a before-and-after story.">Impact &amp; learning</SectionTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2" title="% of flagged orders that disputed · 12 weeks" right={<Chip tone="amber">Illustrative</Chip>}>
          <LineChart />
          <p className="mt-2 text-sm font-medium text-slate-700">The gap between the lines is the causal effect.</p>
        </Card>

        <div className="space-y-6">
          <Card
            title={
              <span className="flex items-center">
                Net cost per flagged order
                <InfoTip content="Includes lost disputes, ops time and every proactive rupee." />
              </span>
            }
          >
            <div className="flex items-end gap-5">
              <div>
                <div className="text-xs text-slate-500">Holdout</div>
                <div className="text-2xl font-semibold tabular-nums text-slate-500">{inr(impact.costHoldout)}</div>
              </div>
              <div className="pb-1 text-slate-300">vs</div>
              <div>
                <div className="text-xs text-slate-500">Treated</div>
                <div className="text-2xl font-semibold tabular-nums text-ok">{inr(impact.costTreated)}</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Illustrative · synthetic</p>
          </Card>
          <Card title="Merchant overrides">
            <div className="text-3xl font-semibold tabular-nums">{state.overrides}</div>
            <p className="mt-1 text-xs text-slate-500">
              Skips this session{decided ? ` · ${overridePct}% of ${decided} decided recommendations` : ''}. Each override is a training label.
            </p>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          className="min-w-0 lg:col-span-2"
          title="Steady state for Fashion Tales (synthetic)"
          right={
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {(['base', 'conservative'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setScenario(k)}
                  className={cx('rounded-md px-3 py-1 text-xs font-medium capitalize transition', scenario === k ? 'bg-white text-primary shadow-sm' : 'text-slate-600')}
                >
                  {k}
                </button>
              ))}
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Fig label="Card ratio" value={sc.card} />
            <Fig label="January" value={sc.jan} />
            <Fig label="Net saving / month" value={inr(sc.saving)} accent />
          </div>
          <p className="mt-4 text-xs text-slate-500">{impact.assumptions}</p>
        </Card>

        <Card title="Kill criteria">
          <ul className="space-y-2 text-[13px] text-slate-700">
            {impact.killCriteria.map((k) => (
              <li key={k} className="flex gap-2">
                <span className="text-risk">■</span>
                {k}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6" title="How it learns before 90 days">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {impact.learning.map((l, i) => (
            <li key={l.signal} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-[13px]">
              <span className="text-slate-700">{l.signal}</span>
              <Chip tone={i === impact.learning.length - 1 ? 'grey' : i < 2 ? 'green' : 'blue'}>{l.timing}</Chip>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Fig({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={cx('mt-1 text-xl font-semibold tabular-nums', accent ? 'text-ok' : 'text-slate-900')}>{value}</div>
    </div>
  );
}

function LineChart() {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 280;
  const m = { l: 44, r: 92, t: 16, b: 34 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const n = impact.weeks.length;
  const x = (i: number) => m.l + (i / (n - 1)) * iw;
  const y = (v: number) => m.t + ih - (v / 40) * ih;
  const path = (s: number[]) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const yTicks = [0, 10, 20, 30, 40];
  const last = n - 1;

  return (
    <div className="relative">
      <div className="mb-2 flex gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: HOLDOUT }} /> Holdout (no proactive action)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: TREATED }} /> Treated (Pre-empt)
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)} role="img" aria-label="Line chart: holdout flat near 33%, treated falls from 30% to 15% over 12 weeks">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="#E2E8F0" strokeWidth={1} />
            <text x={m.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#94A3B8">
              {t}%
            </text>
          </g>
        ))}
        {impact.weeks.map((w, i) => (
          <text key={w} x={x(i)} y={H - 12} textAnchor="middle" fontSize={11} fill="#94A3B8">
            W{w}
          </text>
        ))}
        {/* gap shading */}
        <path
          d={`${path(impact.holdoutSeries)} ${impact.treatedSeries
            .map((v, i) => [i, v] as const)
            .reverse()
            .map(([i, v]) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`)
            .join(' ')} Z`}
          fill={TREATED}
          opacity={0.06}
        />
        <path d={path(impact.holdoutSeries)} fill="none" stroke={HOLDOUT} strokeWidth={2} strokeLinejoin="round" />
        <path d={path(impact.treatedSeries)} fill="none" stroke={TREATED} strokeWidth={2} strokeLinejoin="round" className="line-draw" />
        {/* direct labels at line ends */}
        <circle cx={x(last)} cy={y(impact.holdoutSeries[last])} r={4} fill={HOLDOUT} stroke="white" strokeWidth={2} />
        <circle cx={x(last)} cy={y(impact.treatedSeries[last])} r={4} fill={TREATED} stroke="white" strokeWidth={2} />
        <text x={x(last) + 10} y={y(impact.holdoutSeries[last]) + 4} fontSize={12} fill="#334155" fontWeight={600}>
          Holdout {impact.holdoutSeries[last]}%
        </text>
        <text x={x(last) + 10} y={y(impact.treatedSeries[last]) + 4} fontSize={12} fill="#334155" fontWeight={600}>
          Treated {impact.treatedSeries[last]}%
        </text>
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="#94A3B8" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(impact.holdoutSeries[hover])} r={4.5} fill={HOLDOUT} stroke="white" strokeWidth={2} />
            <circle cx={x(hover)} cy={y(impact.treatedSeries[hover])} r={4.5} fill={TREATED} stroke="white" strokeWidth={2} />
          </g>
        )}
        {impact.weeks.map((_, i) => (
          <rect key={i} x={x(i) - iw / (n - 1) / 2} y={m.t} width={iw / (n - 1)} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-8 rounded-lg bg-navy px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: `calc(${(x(hover) / W) * 100}% + ${hover > n / 2 ? -150 : 12}px)` }}
        >
          <div className="mb-1 font-semibold">Week {impact.weeks[hover]}</div>
          <div>Holdout: {impact.holdoutSeries[hover]}%</div>
          <div>Treated: {impact.treatedSeries[hover]}%</div>
          <div className="mt-0.5 text-slate-300">Gap: {impact.holdoutSeries[hover] - impact.treatedSeries[hover]} pts</div>
        </div>
      )}
    </div>
  );
}
