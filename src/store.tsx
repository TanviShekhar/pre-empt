import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import {
  confirmedLateOrder,
  defaultThresholds,
  DEMO_START_MIN,
  isUPI,
  methodOf,
  paymentIds,
  ping48230,
  ratio,
  reviewQueue,
  seedAudit,
  softPings,
  spend,
  thresholdMeta,
  type ActionOption,
  type AuditEntry,
  type OptionKind,
  type QueueOrder,
  type SoftPing,
  type ThresholdKey,
} from './data';
import { hhmm, inr, pc, pct } from './format';

export type Screen = 'overview' | 'queue' | 'order' | 'pings' | 'controls' | 'impact' | 'audit';
export type Mode = 'recommend' | 'review' | 'auto';
export type QueueSort = 'saved' | 'urgency' | 'risk' | 'value' | 'newest' | 'oldest';
export type QueueFilter = 'all' | 'pending' | 'done';

export const queueSortLabels: Record<QueueSort, string> = {
  saved: 'Money saved',
  urgency: 'Urgency',
  risk: 'Dispute risk',
  value: 'Order value',
  newest: 'Newest first',
  oldest: 'Oldest first',
};

export interface TourState {
  active: boolean;
  step: number;
  returnScreen: Screen;
  returnOrderId: string | null;
}

export interface QueueRow {
  order: QueueOrder;
  status: 'pending' | 'approved' | 'skipped';
  time?: string;
  optionId?: string;
  skipReason?: string;
  isNew?: boolean;
}

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'info' | 'warn';
}

export type Thresholds = typeof defaultThresholds;

export interface State {
  screen: Screen;
  orderId: string | null;
  paused: boolean;
  mode: Mode;
  queue: QueueRow[];
  pings: SoftPing[];
  selectedPing: string;
  janHundredths: number; // January projection with Pre-empt, in hundredths of a percent
  steady: boolean;
  spendWeek: number;
  spendToday: number;
  audit: AuditEntry[];
  overrides: number;
  clockMin: number;
  fastForwarded: Record<string, boolean>;
  thresholds: Thresholds;
  changedSettings: Partial<Record<ThresholdKey, boolean>>;
  saleMode: boolean;
  laneOverrides: Record<string, number>;
  unblocked: Record<string, boolean>;
  queueSort: QueueSort;
  queueFilter: QueueFilter;
  tour: TourState;
  tourPromptDismissed: boolean;
  presenter: boolean; // on: demo controls + pitch material visible; off: clean merchant screens
  toasts: Toast[];
  toastSeq: number;
}

export const initialState = (): State => ({
  screen: 'overview',
  orderId: null,
  paused: false,
  mode: 'review',
  queue: reviewQueue.map((order) => ({ order, status: 'pending' })),
  pings: softPings.map((p) => ({ ...p })),
  selectedPing: 'ORD-48230',
  janHundredths: Math.round(ratio.janWithout * 100),
  steady: false,
  spendWeek: spend.weekStart,
  spendToday: spend.todayStart,
  audit: [...seedAudit],
  overrides: 0,
  clockMin: DEMO_START_MIN,
  fastForwarded: {},
  thresholds: { ...defaultThresholds },
  changedSettings: {},
  saleMode: false,
  laneOverrides: {},
  unblocked: {},
  queueSort: 'saved',
  queueFilter: 'all',
  tour: { active: false, step: 0, returnScreen: 'overview', returnOrderId: null },
  tourPromptDismissed: false,
  presenter: true,
  toasts: [],
  toastSeq: 0,
});

export type Action =
  | { type: 'nav'; screen: Screen; orderId?: string }
  | { type: 'approve'; orderId: string; optionId: string; edited?: boolean }
  | { type: 'approveZeroMoney' }
  | { type: 'skip'; orderId: string; reason: string }
  | { type: 'unblock'; orderId: string }
  | { type: 'togglePause' }
  | { type: 'setMode'; mode: Mode }
  | { type: 'selectPing'; id: string }
  | { type: 'pingReply'; id: string; reply: 'yes' | 'notyet' | 'noreply' }
  | { type: 'setSteady'; on: boolean }
  | { type: 'fastForward'; orderId: string }
  | { type: 'setThreshold'; key: ThresholdKey; value: number | boolean }
  | { type: 'toggleSaleMode' }
  | { type: 'laneOverride'; lane: string; p90: number }
  | { type: 'messageEdited'; orderId: string }
  | { type: 'exportAudit' }
  | { type: 'setQueueSort'; sort: QueueSort }
  | { type: 'setQueueFilter'; filter: QueueFilter }
  | { type: 'startTour' }
  | { type: 'tourStep'; step: number }
  | { type: 'endTour' }
  | { type: 'dismissTourPrompt' }
  | { type: 'togglePresenter' }
  | { type: 'toast'; text: string; tone?: Toast['tone'] }
  | { type: 'dismissToast'; id: number }
  | { type: 'reset' };

// ---------- helpers shared with the screens ----------

export const recOf = (o: QueueOrder) => o.options.find((x) => x.recommended) ?? o.options[0];
export const noneOf = (o: QueueOrder) => o.options.find((x) => x.kind === 'none') ?? o.options[0];
export const savingOf = (o: QueueOrder) => noneOf(o).expectedCost - recOf(o).expectedCost;

/** Recommended actions that move no money at all. */
export const isZeroMoney = (opt: ActionOption) => opt.kind !== 'none' && opt.actionCost === 0 && !opt.refundAmount;

export const actionLabel = (kind: OptionKind) =>
  kind === 'evidence' ? 'Request evidence' : kind === 'message' ? 'Send message' : 'Approve';
export const doneLabel = (kind: OptionKind) =>
  kind === 'evidence' ? 'Evidence requested' : kind === 'message' ? 'Sent' : 'Approved';

export const isOptionBlocked = (s: State, orderId: string, opt: ActionOption) => !!opt.disabledReason && !s.unblocked[orderId];

const sortKey: Record<QueueSort, (o: QueueOrder) => number> = {
  saved: (o) => -savingOf(o),
  urgency: (o) => o.actBy.rank,
  risk: (o) => -o.pDispute,
  value: (o) => -o.amount,
  newest: (o) => -Date.parse(o.paidAt),
  oldest: (o) => Date.parse(o.paidAt),
};

/** Queue rows in the merchant's chosen order; ties fall back to money saved. */
export const sortedQueue = (s: State) =>
  [...s.queue].sort((a, b) => sortKey[s.queueSort](a.order) - sortKey[s.queueSort](b.order) || savingOf(b.order) - savingOf(a.order));

export const visibleQueue = (s: State) =>
  sortedQueue(s).filter((r) => (s.queueFilter === 'all' ? true : s.queueFilter === 'pending' ? r.status === 'pending' : r.status !== 'pending'));

export const pendingCount = (s: State) => s.queue.filter((r) => r.status === 'pending').length;
export const awaitingPings = (s: State) => s.pings.filter((p) => p.status === 'awaiting').length;
export const janValue = (s: State) => s.janHundredths / 100;
export const zeroMoneyPending = (s: State) => s.queue.filter((r) => r.status === 'pending' && isZeroMoney(recOf(r.order)));

export const moneyAtRisk = (s: State) => {
  const pending = s.queue.filter((r) => r.status === 'pending');
  const atRisk = pending.reduce((n, r) => n + noneOf(r.order).expectedCost, 0);
  const withRec = pending.reduce((n, r) => n + recOf(r.order).expectedCost, 0);
  return { atRisk, withRec, saves: atRisk - withRec };
};

export const formatSetting = (key: ThresholdKey, v: number | boolean) => {
  const unit = thresholdMeta[key].unit;
  if (unit === 'bool') return v ? 'on' : 'off';
  const n = v as number;
  if (unit === 'pct') return `${n}%`;
  if (unit === 'inr') return inr(n);
  if (unit === 'h') return `${n}h`;
  if (unit === 'pctile') return `${n}th percentile`;
  return String(n);
};

// ---------- reducer internals ----------

const tick = (s: State) => {
  const clockMin = s.clockMin + 1;
  return { clockMin, time: hhmm(clockMin) };
};

const withToast = (s: State, text: string, tone: Toast['tone'] = 'ok'): State => {
  const id = s.toastSeq + 1;
  return { ...s, toastSeq: id, toasts: [...s.toasts, { id, text, tone }] };
};

const log = (s: State, entry: Omit<AuditEntry, 'time'>, time: string): AuditEntry[] => [...s.audit, { ...entry, time }];

const settingEntry = (action: string): Omit<AuditEntry, 'time'> => ({
  actor: 'Merchant',
  order: '—',
  action,
  amount: null,
  paymentId: '—',
  why: '—',
  decidedBy: 'Merchant',
});

/** Applies one approval without a toast. Returns null if the approval is not allowed. */
function applyApproval(s: State, orderId: string, optionId: string, edited: boolean): State | null {
  const row = s.queue.find((r) => r.order.id === orderId);
  if (!row || row.status !== 'pending') return null;
  const opt = row.order.options.find((o) => o.id === optionId);
  if (!opt || isOptionBlocked(s, orderId, opt)) return null;
  const { clockMin, time } = tick(s);
  const verb = edited ? 'Edited and approved' : doneLabel(opt.kind);
  return {
    ...s,
    clockMin,
    queue: s.queue.map((r) => (r.order.id === orderId ? { ...r, status: 'approved' as const, time, optionId: opt.id } : r)),
    janHundredths: s.janHundredths + Math.round(opt.janImpact * 100),
    spendWeek: s.spendWeek + opt.actionCost,
    spendToday: s.spendToday + opt.actionCost,
    audit: log(
      s,
      {
        actor: 'Merchant',
        order: row.order.id,
        action: `${verb}: ${opt.label}${opt.costNote ? ` · ${opt.costNote}` : ''}`,
        amount: opt.refundAmount ?? null,
        paymentId: row.order.paymentId,
        why: row.order.topSignal,
        decidedBy: 'Merchant',
        method: methodOf(row.order),
      },
      time,
    ),
  };
}

function approvalToast(order: QueueOrder, opt: ActionOption, janBefore: number, janAfter: number, edited: boolean) {
  const none = noneOf(order);
  if (opt.kind === 'evidence') {
    return `Photo requested and evidence pack started. Win chance ${pc(order.pWin)} → ${pc(opt.pWinAfter ?? order.pWin)}. Expected loss ${inr(none.expectedCost)} → ${inr(opt.expectedCost)}.`;
  }
  const diff = none.expectedCost - opt.expectedCost;
  const save = diff >= 0 ? `saves ${inr(diff)}` : `costs ${inr(-diff)} more`;
  const verb = edited ? 'Edited and approved' : opt.kind === 'message' ? 'Sent' : 'Approved';
  const head = `${verb}. Expected loss ${inr(none.expectedCost)} → ${inr(opt.expectedCost)} (${save}).`;
  if (isUPI(order)) return `${head} UPI order: does not affect the card ratio.`;
  return `${head} January projection ${pct(janBefore / 100)} → ${pct(janAfter / 100)}.`;
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'nav':
      return { ...s, screen: a.screen, orderId: a.orderId ?? s.orderId };

    case 'approve': {
      if (s.paused) return withToast(s, 'Agent is paused. Resume to approve actions.', 'warn');
      const next = applyApproval(s, a.orderId, a.optionId, !!a.edited);
      if (!next) return s;
      const row = s.queue.find((r) => r.order.id === a.orderId)!;
      const opt = row.order.options.find((o) => o.id === a.optionId)!;
      return withToast(next, approvalToast(row.order, opt, s.janHundredths, next.janHundredths, !!a.edited));
    }

    case 'approveZeroMoney': {
      if (s.paused) return withToast(s, 'Agent is paused. Resume to approve actions.', 'warn');
      const rows = zeroMoneyPending(s);
      if (!rows.length) return s;
      let next = s;
      for (const r of rows) next = applyApproval(next, r.order.id, recOf(r.order).id, false) ?? next;
      const before = rows.reduce((n, r) => n + noneOf(r.order).expectedCost, 0);
      const after = rows.reduce((n, r) => n + recOf(r.order).expectedCost, 0);
      const jan = next.janHundredths !== s.janHundredths ? ` January projection ${pct(s.janHundredths / 100)} → ${pct(next.janHundredths / 100)}.` : '';
      return withToast(
        next,
        `Sent ${rows.length} ₹0 action${rows.length === 1 ? '' : 's'}. Expected loss ${inr(before)} → ${inr(after)} (saves ${inr(before - after)}).${jan}`,
      );
    }

    case 'skip': {
      const row = s.queue.find((r) => r.order.id === a.orderId);
      if (!row || row.status !== 'pending') return s;
      const { clockMin, time } = tick(s);
      const next: State = {
        ...s,
        clockMin,
        overrides: s.overrides + 1,
        queue: s.queue.map((r) => (r.order.id === a.orderId ? { ...r, status: 'skipped' as const, time, skipReason: a.reason } : r)),
        audit: log(
          s,
          {
            actor: 'Merchant',
            order: a.orderId,
            action: `Skipped recommendation · ${a.reason}`,
            amount: null,
            paymentId: row.order.paymentId,
            why: row.order.topSignal,
            decidedBy: 'Merchant',
          },
          time,
        ),
      };
      return withToast(next, `Skipped ${a.orderId}. Logged as a merchant override (${a.reason}).`, 'info');
    }

    case 'unblock': {
      if (s.unblocked[a.orderId]) return s;
      const row = s.queue.find((r) => r.order.id === a.orderId);
      const { clockMin, time } = tick(s);
      const next: State = {
        ...s,
        clockMin,
        unblocked: { ...s.unblocked, [a.orderId]: true },
        audit: log(
          s,
          {
            actor: 'Merchant',
            order: a.orderId,
            action: 'Refund-abuse block overridden: treat as a normal customer',
            amount: null,
            paymentId: row?.order.paymentId ?? '—',
            why: 'Merchant override of refund-abuse risk',
            decidedBy: 'Merchant',
          },
          time,
        ),
      };
      return withToast(next, `${a.orderId}: ₹150 credit option unlocked. Override logged.`, 'info');
    }

    case 'togglePause': {
      const { clockMin, time } = tick(s);
      const paused = !s.paused;
      const next = { ...s, paused, clockMin, audit: log(s, settingEntry(paused ? 'Agent paused' : 'Agent resumed'), time) };
      return withToast(next, paused ? 'Agent paused. No actions will be sent and approvals are disabled.' : 'Agent resumed.', paused ? 'warn' : 'ok');
    }

    case 'setMode': {
      if (a.mode === s.mode) return s;
      const { clockMin, time } = tick(s);
      const names: Record<Mode, string> = { recommend: 'Recommend-only', review: 'Review-first', auto: 'Auto within limits' };
      const next = { ...s, mode: a.mode, clockMin, audit: log(s, settingEntry(`Mode changed to ${names[a.mode]}`), time) };
      return withToast(next, `Mode set to ${names[a.mode]}.`, 'info');
    }

    case 'selectPing':
      return { ...s, selectedPing: a.id };

    case 'pingReply': {
      const ping = s.pings.find((p) => p.id === a.id);
      if (!ping || ping.status !== 'awaiting') return s;
      const { clockMin, time } = tick(s);
      const pay = paymentIds[a.id] ?? '—';
      const why = 'Customer reply to soft ping (simulated)';
      if (a.reply === 'yes') {
        const janHundredths = s.janHundredths + Math.round(ping48230.janImpactYes * 100);
        const next: State = {
          ...s,
          clockMin,
          janHundredths,
          pings: s.pings.map((p) =>
            p.id === a.id
              ? { ...p, status: 'closed', statusText: 'Closed at ₹0 · courier scan marked stale · lane baseline BLR-560xx updated', reply: 'Yes, received', replyTime: 'simulated' }
              : p,
          ),
          audit: log(
            s,
            { actor: 'Customer', order: a.id, action: 'Reply “Yes, received” · closed at ₹0 · lane baseline BLR-560xx updated', amount: 0, paymentId: pay, why, decidedBy: 'Rule', method: 'Rule' },
            time,
          ),
        };
        return withToast(
          next,
          `Resolved at ₹0. Courier scan marked stale; lane baseline BLR-560xx updated. January projection ${pct(s.janHundredths / 100)} → ${pct(janHundredths / 100)}.`,
        );
      }
      if (a.reply === 'notyet') {
        const next: State = {
          ...s,
          clockMin,
          pings: s.pings.map((p) =>
            p.id === a.id ? { ...p, status: 'confirmed_late', statusText: 'Confirmed late · added to your review queue', reply: 'Not yet', replyTime: 'simulated' } : p,
          ),
          queue: [...s.queue, { order: confirmedLateOrder, status: 'pending', isNew: true }],
          audit: log(
            s,
            { actor: 'Customer', order: a.id, action: 'Reply “Not yet” · confirmed late · added to review queue', amount: null, paymentId: pay, why, decidedBy: 'Rule', method: 'Rule' },
            time,
          ),
        };
        return withToast(next, 'Confirmed by customer. Added to your review queue.', 'info');
      }
      const next: State = {
        ...s,
        clockMin,
        pings: s.pings.map((p) => (p.id === a.id ? { ...p, status: 'noreply_scheduled', statusText: 'Status message scheduled · no money' } : p)),
        audit: log(
          s,
          { actor: 'Pre-empt', order: a.id, action: 'No reply in 24h · status message scheduled, no money', amount: null, paymentId: pay, why: 'No reply to soft ping in 24h (simulated)', decidedBy: 'Rule', method: 'Rule' },
          time,
        ),
      };
      return withToast(
        next,
        'No reply in 24h. Silence is weak evidence (most people ignore pings), so Pre-empt sends a neutral status message and spends nothing.',
        'info',
      );
    }

    case 'setSteady':
      return { ...s, steady: a.on };

    case 'fastForward':
      return { ...s, fastForwarded: { ...s.fastForwarded, [a.orderId]: true } };

    case 'setThreshold': {
      const from = s.thresholds[a.key];
      if (from === a.value) return s;
      const { clockMin, time } = tick(s);
      return {
        ...s,
        clockMin,
        thresholds: { ...s.thresholds, [a.key]: a.value },
        changedSettings: { ...s.changedSettings, [a.key]: true },
        audit: log(
          s,
          settingEntry(`Threshold changed: ${thresholdMeta[a.key].name} from ${formatSetting(a.key, from)} to ${formatSetting(a.key, a.value)}`),
          time,
        ),
      };
    }

    case 'toggleSaleMode': {
      const { clockMin, time } = tick(s);
      const saleMode = !s.saleMode;
      return withToast(
        { ...s, saleMode, clockMin, audit: log(s, settingEntry(`Threshold changed: Sale mode x2 from ${saleMode ? 'off to on' : 'on to off'}`), time) },
        saleMode
          ? `Sale mode on: caps doubled to ${inr(s.thresholds.dailyCap * 2)} a day, ${inr(s.thresholds.weeklyCap * 2)} a week.`
          : 'Sale mode off: caps restored.',
        'info',
      );
    }

    case 'laneOverride': {
      const { clockMin, time } = tick(s);
      return withToast(
        {
          ...s,
          clockMin,
          laneOverrides: { ...s.laneOverrides, [a.lane]: a.p90 },
          audit: log(s, settingEntry(`Lane override ${a.lane}: 90th pct set to ${a.p90.toFixed(1)} days`), time),
        },
        `Override saved for ${a.lane} and recorded in the audit log.`,
        'info',
      );
    }

    case 'messageEdited': {
      const row = s.queue.find((r) => r.order.id === a.orderId);
      const { clockMin, time } = tick(s);
      return {
        ...s,
        clockMin,
        audit: log(
          s,
          {
            actor: 'Merchant',
            order: a.orderId,
            action: 'Message edited (within approved template)',
            amount: null,
            paymentId: row?.order.paymentId ?? '—',
            why: row?.order.topSignal ?? '—',
            decidedBy: 'Merchant',
          },
          time,
        ),
      };
    }

    case 'exportAudit':
      return withToast(s, `Audit log exported (${s.audit.length} rows, CSV).`, 'info');

    case 'setQueueSort':
      return { ...s, queueSort: a.sort };

    case 'setQueueFilter':
      return { ...s, queueFilter: a.filter };

    case 'startTour':
      return {
        ...s,
        tourPromptDismissed: true,
        tour: { active: true, step: 0, returnScreen: s.screen, returnOrderId: s.orderId },
      };

    case 'tourStep':
      return { ...s, tour: { ...s.tour, step: a.step } };

    case 'endTour':
      return { ...s, screen: s.tour.returnScreen, orderId: s.tour.returnOrderId, tour: { ...s.tour, active: false } };

    case 'dismissTourPrompt':
      return { ...s, tourPromptDismissed: true };

    case 'togglePresenter': {
      const presenter = !s.presenter;
      // pitch-only views can't stay open once they're hidden
      const screen = !presenter && s.screen === 'impact' ? 'overview' : s.screen;
      return withToast(
        { ...s, presenter, screen, steady: presenter ? s.steady : false },
        presenter ? 'Presenter mode on: demo controls and pitch material are shown.' : 'Presenter mode off: showing clean merchant screens.',
        'info',
      );
    }

    case 'toast':
      return withToast(s, a.text, a.tone);

    case 'dismissToast':
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };

    case 'reset':
      return withToast({ ...initialState(), presenter: s.presenter }, 'Demo reset.', 'info');
  }
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}
