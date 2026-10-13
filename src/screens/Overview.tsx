import { funnel, holdoutInfo, impact, last7Days, ratio } from '../data';
import { inr, pct } from '../format';
import { janValue, moneyAtRisk, pendingCount, useStore } from '../store';
import { DisputeGauge } from '../components/Gauge';
import { Button, Card, InfoTip, SectionTitle, useAnimatedNumber, cx } from '../components/ui';

export function Overview() {
  const { state, dispatch } = useStore();
  const jan = janValue(state);
  const showBlue = jan < ratio.janWithout;
  const pending = pendingCount(state);
  const weeklyCap = state.thresholds.weeklyCap * (state.saleMode ? 2 : 1);
  const money = moneyAtRisk(state);
  const nowShown = useAnimatedNumber(state.steady ? ratio.steadyNow : ratio.current, 1000);
  const janShown = state.steady ? ratio.steadyBase : jan;

  return (
    <div className="space-y-6">
      <SectionTitle sub="Predicts which shipped orders will turn into chargebacks, and takes the cheapest action that prevents them. Nothing involving money happens without your approval.">
        Overview
      </SectionTitle>

      {!state.tourPromptDismissed && (
        <div className="fade-in flex flex-wrap items-center justify-between gap-3 rounded-card border border-blue-200 bg-blue-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white" aria-hidden>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4v16l13-8z" />
              </svg>
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">New here? Take the 60-second tour.</div>
              <div className="text-xs text-slate-600">See how Pre-empt spots risky orders and what it needs from you. You can reopen it anytime from “How it works”.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'dismissTourPrompt' })}>
              Not now
            </Button>
            <Button size="sm" onClick={() => dispatch({ type: 'startTour' })}>
              Start tour
            </Button>
          </div>
        </div>
      )}

      <Card tour="gauge">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1 basis-72">
            <h2 className="text-lg font-semibold text-slate-900">Dispute-ratio headroom</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Card dispute ratio, trailing 30 days. Your payments dashboard lists disputes but does not show this ratio.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-8">
            <div className="sm:text-right">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{state.steady ? 'Now, steady state' : 'Now'}</div>
              <div className={cx('text-5xl font-semibold tabular-nums tracking-tight', state.steady ? 'text-warn' : 'text-slate-900')}>{pct(nowShown)}</div>
              {state.steady ? (
                <>
                  <div className="mt-1 text-xs font-medium text-warn">Below the 0.7% Excessive line (steady state, synthetic)</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Conservative: {pct(ratio.steadyNowConservative)}</div>
                </>
              ) : (
                <div className="mt-1 text-xs font-medium text-risk">Above the 0.7% Excessive line</div>
              )}
            </div>
            <div className="max-w-[240px] sm:text-right">
              {showBlue || state.steady ? (
                <>
                  <div className="flex items-center text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:justify-end">
                    January, projected
                    <InfoTip content={ratio.janTooltip} />
                  </div>
                  <div className="text-3xl font-semibold tabular-nums text-primary">{pct(janShown)}</div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    with Pre-empt{state.steady ? ', steady state (synthetic)' : ''} · <span className="font-medium text-risk">{pct(ratio.janWithout)} no action</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:justify-end">
                    January, projected (no action)
                    <InfoTip content={ratio.janTooltip} />
                  </div>
                  <div className="text-3xl font-semibold tabular-nums text-risk">{pct(ratio.janWithout)}</div>
                </>
              )}
              <div className="mt-1 text-xs text-slate-500">{ratio.janCaption}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <DisputeGauge jan={jan} showBlue={showBlue} steady={state.steady} />
        </div>

        {state.presenter && (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {!state.steady ? (
            <Button onClick={() => dispatch({ type: 'setSteady', on: true })}>Project steady state (3 months, synthetic)</Button>
          ) : (
            <Button variant="secondary" onClick={() => dispatch({ type: 'setSteady', on: false })}>
              Back to this week&rsquo;s actions
            </Button>
          )}
          {state.steady && (
            <p className="fade-in max-w-3xl text-sm text-slate-700">
              If Fashion Tales&rsquo; next three months look like this week, January lands at <b className="text-primary">1.17%</b> instead of{' '}
              <b>1.70%</b>, and today&rsquo;s ratio falls to <b>0.55%</b>. <span className="text-slate-500">Synthetic projection.</span>
            </p>
          )}
        </div>
        )}
        <p className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-500">{ratio.footnote}</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button
          data-tour="money"
          onClick={() => dispatch({ type: 'nav', screen: 'queue' })}
          className="group flex flex-col rounded-card border border-slate-200/70 bg-white p-5 text-left shadow-card transition hover:border-primary hover:ring-2 hover:ring-blue-100"
        >
          <div className="text-xs font-medium text-slate-500">Money at risk in your queue</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-risk">{inr(money.atRisk)}</div>
          <div className="mt-1 text-xs leading-snug text-slate-600">
            {inr(money.withRec)} if you approve the recommendations · <span className="font-semibold text-ok">saves {inr(money.saves)}</span>
          </div>
        </button>
        <Tile label="Flagged (last 7 days)" value={String(last7Days.flagged)} sub={last7Days.flaggedLine} />
        <Tile label="Handled automatically" value={String(last7Days.auto)} sub={last7Days.autoLine} />
        <button
          onClick={() => dispatch({ type: 'nav', screen: 'queue' })}
          className="group flex flex-col rounded-card border border-slate-200/70 bg-white p-5 text-left shadow-card transition hover:border-primary hover:ring-2 hover:ring-blue-100"
        >
          <div className="text-xs font-medium text-slate-500">Awaiting your review</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{pending}</div>
          <div className="mt-1 text-xs font-medium text-primary group-hover:underline">Open review queue →</div>
        </button>
        <div className="flex flex-col rounded-card border border-slate-200/70 bg-white p-5 shadow-card">
          <div className="text-xs font-medium text-slate-500">Proactive spend (this week)</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{inr(state.spendWeek)}</div>
          <div className="mt-1 text-xs text-slate-500">of {inr(weeklyCap)} weekly cap</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, (state.spendWeek / weeklyCap) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Pitch material below: shown only in presenter mode */}
      {state.presenter && (
      <>
      <Card title="Where Pre-empt sits">
        <ol className="flex flex-col items-stretch gap-2 min-[700px]:flex-row">
          {funnel.map((f, i) => (
            <li
              key={f.step}
              className={cx(
                'flex flex-col items-stretch gap-2 min-[700px]:flex-row min-[700px]:items-center',
                f.step === 'Complaint' ? 'min-[700px]:flex-[1.7]' : f.step === 'Checkout' ? 'min-[700px]:flex-[1.5]' : 'min-[700px]:flex-1',
              )}
            >
              <div
                className={cx(
                  'flex h-full flex-1 flex-col rounded-lg border p-3',
                  f.highlight ? 'border-primary bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50',
                )}
              >
                <div className={cx('text-[11px] font-semibold uppercase tracking-wider', f.highlight ? 'text-primary' : 'text-slate-500')}>{f.step}</div>
                <div className={cx('mt-1 leading-snug', f.tools.length <= 20 ? 'whitespace-nowrap' : '[text-wrap:balance]', f.highlight ? 'text-sm font-semibold text-primary' : 'text-xs text-slate-700')}>
                  {f.tools || <span className="text-slate-400">Bank decides</span>}
                </div>
              </div>
              {i < funnel.length - 1 && (
                <span className="self-center text-slate-300" aria-hidden>
                  <span className="min-[700px]:hidden">↓</span>
                  <span className="hidden min-[700px]:inline">→</span>
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm font-medium text-slate-700">
          Checkout tools stop risky orders before they ship. After shipping, every existing tool waits for the customer to complain. Pre-empt acts first.
        </p>
      </Card>

      <Card title={<span className="flex items-center">Measured against holdout<InfoTip content={holdoutInfo} width={300} /></span>}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-end gap-6">
            <div>
              <div className="text-xs text-slate-500">Holdout</div>
              <div className="text-3xl font-semibold tabular-nums text-slate-500">{impact.holdoutRate}%</div>
            </div>
            <div className="pb-2 text-slate-300">vs</div>
            <div>
              <div className="text-xs text-slate-500">Treated</div>
              <div className="text-3xl font-semibold tabular-nums text-ok">{impact.treatedRate}%</div>
            </div>
          </div>
          <p className="min-w-0 flex-1 basis-64 text-sm text-slate-600">
            Flagged orders that later disputed: holdout 33% vs treated 15% <span className="text-slate-500">(pooled across merchants, illustrative)</span>
          </p>
        </div>
      </Card>
      </>
      )}
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col rounded-card border border-slate-200/70 bg-white p-5 shadow-card">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{value}</div>
      <div className="mt-1 text-xs leading-snug text-slate-500">{sub}</div>
    </div>
  );
}
