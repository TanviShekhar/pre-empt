import { useEffect } from 'react';
import { ratio } from '../data';
import { pct } from '../format';
import { InfoTip, Tooltip, useAnimatedNumber, cx } from './ui';

const toPct = (v: number) => `${(v / ratio.gaugeMax) * 100}%`;

// Remembers where the blue marker was last drawn, so returning to Overview animates from there.
let lastBlue = ratio.janWithout;

function Track() {
  // zone shading: below 0.5 green, 0.5–0.7 amber, above 0.7 red
  return (
    <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-slate-100">
      <div className="absolute inset-y-0 left-0 bg-green-200/80" style={{ width: toPct(0.5) }} />
      <div className="absolute inset-y-0 bg-amber-200/80" style={{ left: toPct(0.5), width: toPct(0.2) }} />
      <div className="absolute inset-y-0 bg-red-200/70" style={{ left: toPct(0.7), right: 0 }} />
    </div>
  );
}

export function DisputeGauge({ jan, showBlue, steady }: { jan: number; showBlue: boolean; steady: boolean }) {
  const nowShown = useAnimatedNumber(steady ? ratio.steadyNow : ratio.current, 1000);
  const blueVisible = showBlue || steady;
  useEffect(() => {
    if (!blueVisible) lastBlue = ratio.janWithout;
  }, [blueVisible]);
  const ticks = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  return (
    <div className="overflow-x-auto pb-1">
      <div className="relative mt-2 min-w-[640px] select-none pr-4">
        <div className="flex">
          {/* row labels */}
          <div className="w-40 shrink-0">
            <div className="h-12" />
            <div className="flex h-[72px] flex-col justify-center pr-4">
              <div className="text-xs font-semibold text-slate-800">Now</div>
              <div className="text-[11px] text-slate-500">{steady ? 'Steady state (synthetic)' : 'Trailing 30 days'}</div>
            </div>
            <div className="flex h-[104px] flex-col justify-center pr-4">
              <div className="flex items-center text-xs font-semibold text-slate-800">
                Projected January after Diwali
                <InfoTip content={ratio.janTooltip} />
              </div>
              <div className="text-[11px] text-slate-500">Projected</div>
            </div>
          </div>

          {/* plot */}
          <div className="relative flex-1">
            {ratio.references.map((r, i) => (
              <div key={r.value} className="absolute top-0 bottom-6" style={{ left: toPct(r.value) }}>
                <div className={cx('absolute bottom-0 w-px', r.muted ? 'border-l border-dashed border-slate-300' : 'bg-slate-500')} style={{ top: i === 1 ? 26 : 6 }} />
                <div className={cx('absolute whitespace-nowrap pl-1.5 text-[11px] leading-tight', r.muted ? 'text-slate-400' : 'text-slate-600')} style={{ top: i === 1 ? 22 : 2 }}>
                  <span className="font-semibold">{r.value.toFixed(1)}%</span>{' '}
                  {r.muted ? (
                    <span className="inline-flex items-center">
                      Visa merchant line
                      <InfoTip content={r.label} />
                    </span>
                  ) : (
                    r.label
                  )}
                </div>
              </div>
            ))}

            <div className="h-12" />

            {/* row 1: now */}
            <div className="relative h-[72px]">
              <Track />
              <Marker
                value={nowShown}
                color="#0F1B2D"
                label={steady ? `${pct(nowShown)} steady state (synthetic)` : `${pct(nowShown)} now`}
                tier="above1"
                strong={steady}
                strongColor="text-slate-900"
              />
            </div>

            {/* row 2: january projection */}
            <div className="relative h-[104px]">
              <Track />
              <Marker value={ratio.janWithout} color="#94A3B8" label={`${pct(ratio.janWithout)} without Pre-empt`} tier="below" />
              {steady && <Marker value={ratio.steadyConservative} color="#2563EB" dashed label={`${pct(ratio.steadyConservative)} conservative`} tier="above1" />}
              {blueVisible && <BlueMarker target={steady ? ratio.steadyBase : jan} steady={steady} />}
            </div>

            {/* axis */}
            <div className="relative h-6 border-t border-slate-200">
              {ticks.map((t) => (
                <span key={t} className="absolute top-1 -translate-x-1/2 text-[10px] tabular-nums text-slate-400" style={{ left: toPct(t) }}>
                  {t.toFixed(t % 0.5 === 0 ? 1 : 2)}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlueMarker({ target, steady }: { target: number; steady: boolean }) {
  const v = useAnimatedNumber(target, 1000, lastBlue);
  useEffect(() => {
    lastBlue = v;
  }, [v]);
  return (
    <Marker
      value={v}
      color="#2563EB"
      label={`${pct(v)} with Pre-empt, ${steady ? 'steady state (synthetic)' : 'this week’s actions'}`}
      tier={steady ? 'above2' : 'above1'}
      strong
    />
  );
}

type Tier = 'above1' | 'above2' | 'below';
const tierClass: Record<Tier, string> = {
  above1: 'bottom-[calc(50%+14px)]',
  above2: 'bottom-[calc(50%+32px)]',
  below: 'top-[calc(50%+14px)]',
};

function Marker({
  value,
  color,
  label,
  tier,
  dashed,
  strong,
  strongColor = 'text-primary',
}: {
  value: number;
  color: string;
  label: string;
  tier: Tier;
  dashed?: boolean;
  strong?: boolean;
  strongColor?: string;
}) {
  const left = toPct(value);
  const edge = value > 1.6 ? 'right' : value < 0.25 ? 'left' : 'center';
  const labelAlign = edge === 'right' ? 'right-0 translate-x-2' : edge === 'left' ? 'left-0 -translate-x-2' : 'left-1/2 -translate-x-1/2';
  return (
    <div className="absolute inset-y-0 z-10" style={{ left }}>
      <Tooltip content={label} width={220}>
        <span
          className={cx('absolute top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full', strong ? 'h-5 w-5 ring-4 ring-white' : 'h-4 w-4 ring-2 ring-white')}
          style={{
            background: dashed ? 'white' : color,
            border: dashed ? `2px dashed ${color}` : undefined,
            boxShadow: '0 1px 3px rgba(15,27,45,0.3)',
          }}
          aria-label={label}
        />
      </Tooltip>
      <div className={cx('absolute whitespace-nowrap text-xs', tierClass[tier], labelAlign, strong ? `font-semibold ${strongColor}` : 'font-medium text-slate-600')}>
        <span className="tabular-nums">{label}</span>
      </div>
    </div>
  );
}
