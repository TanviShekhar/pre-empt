import { last7Days, ratio } from '../data';
import { inr, pct } from '../format';
import { janValue, moneyAtRisk, pendingCount, useStore } from '../store';
import { DisputeGauge } from '../components/Gauge';
import { Button, Card, InfoTip, SectionTitle } from '../components/ui';

export function Overview() {
  const { state, dispatch } = useStore();
  const jan = janValue(state);
  const showBlue = jan < ratio.janWithout;
  const pending = pendingCount(state);
  const weeklyCap = state.thresholds.weeklyCap * (state.saleMode ? 2 : 1);
  const money = moneyAtRisk(state);

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
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Now</div>
              <div className="text-5xl font-semibold tabular-nums tracking-tight text-slate-900">{pct(ratio.current)}</div>
              <div className="mt-1 text-xs font-medium text-risk">Above the 0.7% Excessive line</div>
            </div>
            <div className="max-w-[240px] sm:text-right">
              {showBlue ? (
                <>
                  <div className="flex items-center text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:justify-end">
                    January, projected
                    <InfoTip content={ratio.janTooltip} />
                  </div>
                  <div className="text-3xl font-semibold tabular-nums text-primary">{pct(jan)}</div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    with Pre-empt · <span className="font-medium text-risk">{pct(ratio.janWithout)} no action</span>
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
          <DisputeGauge jan={jan} showBlue={showBlue} />
        </div>

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
