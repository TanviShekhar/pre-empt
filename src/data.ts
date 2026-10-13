// All demo data for the Pre-empt concept prototype. Everything here is synthetic.

export const DEMO_START_MIN = 16 * 60 + 41; // first live action is stamped 16:42

export const EXPECTED_LOSS_FORMULA =
  'Expected loss = dispute risk after action × (share lost if disputed × order value + ₹300 handling time) + cost of the action.';

export const merchant = {
  name: 'Fashion Tales',
  initials: 'FT',
  description: 'D2C fashion on Shopify and Razorpay',
  gmvMonthly: 15000000,
  ordersMonthly: 12500,
  paymentMix: { upi: 55, cards: 30, cod: 15 },
  disputesMonthly: 50,
  disputeMix: [
    { reason: 'Unrecognised charge', count: 10 },
    { reason: 'Late or not received', count: 20 },
    { reason: 'Not as described (size, colour, quality) or damaged', count: 12 },
    { reason: 'Fraud', count: 8 },
  ],
};

export const ratio = {
  current: 0.8,
  gaugeMax: 2.0,
  references: [
    { value: 0.5, label: 'Acquirer portfolio: Above Standard', muted: false },
    { value: 0.7, label: 'Acquirer portfolio: Excessive', muted: false },
    {
      value: 1.5,
      label:
        'Visa merchant line (applies at 1,500+ fraud and dispute events a month; Fashion Tales is below this)',
      muted: true,
    },
  ],
  janWithout: 1.7,
  janTooltip:
    'Assumes November card volume 2.1x a normal month. Disputes from the sale arrive 30 to 60 days later and are divided by January’s normal volume.',
  janCaption: 'Disputes from the Diwali sale land on January’s smaller volume.',
  footnote:
    'Proxy: card dispute ratio. Visa’s VAMP ratio also counts fraud reports, which Pre-empt does not address.',
};

export const last7Days = {
  flagged: 22,
  flaggedLine: '6 messages · 4 soft pings · 1 ops nudge · 3 credits · 5 in review · 2 holdout · 1 to Dispute Responder',
  auto: 14,
  autoLine: '6 messages · 4 soft pings · 1 ops nudge · 3 credits (₹450)',
  awaitingReview: 5,
  holdout: 2,
  disputeResponder: 1,
};

export const spend = {
  weekStart: 450,
  todayStart: 150,
  dailyCap: 5000,
  weeklyCap: 25000,
};

// One fixed payment ID per order, identical on every reload.
export const paymentIds: Record<string, string> = {
  'ORD-48213': 'pay_Qx7LmT2bV9aKcd',
  'ORD-48177': 'pay_N4rTz8WqLp2sJh',
  'ORD-48102': 'pay_H6vB1kXe9RmYqa',
  'ORD-47990': 'pay_R2cW8nJt5ZpLme',
  'ORD-47856': 'pay_K9dF3sYh7QxVbn',
  'ORD-48230': 'pay_T5gM2vRk8NwPzc',
  'ORD-48219': 'pay_B8jL4qXs6HtWra',
  'ORD-48224': 'pay_F3wY7cNp1KdZue',
  'ORD-48151': 'pay_M1tR6bVx3GqJko',
  'ORD-48140': 'pay_W7eS9hDn4LcAfy',
};

export type OptionKind = 'none' | 'message' | 'credit' | 'refund' | 'evidence';

export interface ActionOption {
  id: string;
  label: string;
  kind: OptionKind;
  pAfter: number | null;
  pWinAfter?: number;
  expectedCost: number;
  costNote?: string; // shown in the Edit drawer
  displayLoss?: { main: string; sub: string }; // replaces the ₹ figure in the queue and on the detail page
  actionCost: number; // proactive rupees that count against caps
  refundAmount?: number; // rupees refunded to customer (may be outside caps)
  janImpact: number; // percentage points, negative = improvement
  recommended?: boolean;
  disabledReason?: string;
  message?: string;
  approvedText?: string; // timeline wording after approval
}

export interface TimelineEvent {
  when: string;
  text: string;
  tone?: 'default' | 'warn' | 'flag' | 'ok';
  muted?: boolean;
}

export interface RiskItem {
  label: string;
  value: number;
  note?: string;
  base?: boolean;
}

export interface AiRow {
  kind: 'Rules' | 'Statistics' | 'Model' | 'Language model';
  used: boolean;
  text: string;
}

export interface QueueOrder {
  id: string;
  amount: number;
  method: string;
  customer: string;
  product?: string;
  firstOrder?: boolean;
  signals: string[]; // full wording, shown on the order detail page
  quickSignals: string[]; // plain short wording for the queue; index i maps to signals[i]
  paidAt: string; // ISO time, used for newest / oldest sorting
  pDispute: number;
  pWin: number;
  recommendedLabel: string;
  source: 'Rule' | 'Model';
  actBy: { when: string; reason?: string; urgent: boolean; rank: number }; // rank: 0 = today, 1 = 2 days, 2 = 3 days
  topSignal: string; // short "why" for the audit log
  note?: string;
  riskChip?: string;
  riskChipTooltip?: string;
  reviewReason?: string;
  paymentId: string;
  options: ActionOption[];
  timeline: TimelineEvent[];
  recommendationReason: string;
  riskItems: RiskItem[];
  riskCaption?: string;
  ai: AiRow[];
  next: string;
}

export const isUPI = (o: { method: string }) => o.method === 'UPI';

// Queue signals that are context rather than warning signs (grey dot instead of red).
export const contextSignals = new Set(['First order from this customer', 'Delivered, OTP confirmed']);

const priyaMessage =
  'Hi Priya, your Festive Kurta Set is delayed by our courier. New ETA: Thu 8 Oct. We’ve refunded ₹150 shipping to your card. Team Fashion Tales';

export const reviewQueue: QueueOrder[] = [
  {
    id: 'ORD-48213',
    amount: 1290,
    method: 'Visa · credit',
    customer: 'Priya S.',
    product: 'Festive Kurta Set',
    firstOrder: true,
    signals: [
      'Transit 7.2 days vs lane 96th percentile 6.2 days (BLR-560xx, surface)',
      'WhatsApp ‘where is my order?? need refund’ unanswered 31h',
    ],
    pDispute: 0.82,
    pWin: 0.28,
    recommendedLabel: 'Delay update + ₹150 shipping credit',
    source: 'Model',
    actBy: { when: 'Act today', reason: 'refund request unanswered 31h', urgent: true, rank: 0 },
    paidAt: '2026-09-28T19:42',
    quickSignals: ['Parcel later than 96% of deliveries on this route', 'Asked for a refund on WhatsApp, no reply for 31h'],
    topSignal: 'Transit at 96th pct + refund request unanswered 31h',
    paymentId: paymentIds['ORD-48213'],
    recommendationReason:
      'Cheapest expected loss. Fixes the real problem (silence) and adds a small goodwill credit.',
    options: [
      { id: 'none', label: 'Do nothing', kind: 'none', pAfter: 0.82, expectedCost: 1008, actionCost: 0, janImpact: 0 },
      {
        id: 'msg',
        label: 'Message only',
        kind: 'message',
        pAfter: 0.43,
        expectedCost: 528,
        actionCost: 0,
        janImpact: -0.02,
        message:
          'Hi Priya, your Festive Kurta Set is delayed by our courier. New ETA: Thu 8 Oct. Sorry for the wait. Team Fashion Tales',
      },
      {
        id: 'msg_credit',
        label: 'Message + ₹150 credit',
        kind: 'credit',
        pAfter: 0.13,
        expectedCost: 310,
        actionCost: 150,
        refundAmount: 150,
        janImpact: -0.04,
        recommended: true,
        approvedText: 'delay update + ₹150 credit',
        message: priyaMessage,
      },
      {
        id: 'refund',
        label: 'Full refund',
        kind: 'refund',
        pAfter: 0.0,
        expectedCost: 1290,
        actionCost: 1290,
        refundAmount: 1290,
        janImpact: -0.05,
        message: 'Hi Priya, sorry your Festive Kurta Set is delayed. We’ve refunded ₹1,290 in full to your card. Team Fashion Tales',
      },
    ],
    timeline: [
      { when: 'Mon 28 Sep 19:42', text: 'Paid ₹1,290 · Visa · credit' },
      { when: 'Tue 29 Sep 11:10', text: 'Shipped via surface courier · promised ETA Fri 2 Oct' },
      { when: 'Sat 3 Oct', text: 'ETA missed · last scan “in transit” unchanged', tone: 'warn' },
      {
        when: 'Mon 5 Oct 09:20',
        text: 'WhatsApp from customer: “where is my order?? need refund” · unanswered',
        tone: 'warn',
      },
      { when: 'Tue 6 Oct 16:30', text: 'Pre-empt flagged · dispute risk 82% · win chance 28%', tone: 'flag' },
    ],
    riskItems: [
      { label: 'Base rate for eligible orders', value: 0.2, base: true },
      { label: 'Transit 7.2 days vs lane 96th percentile 6.2 days', value: 0.31 },
      { label: 'Refund-intent message unanswered 31h', value: 0.27, note: 'strongest predictor in this merchant’s history' },
      { label: 'First order, Visa credit, ₹1,290', value: 0.09 },
      { label: 'No prior refunds', value: -0.05, note: 'not a refund-farming pattern' },
    ],
    riskCaption:
      'Lateness is measured against this courier-lane’s live distribution, not the promised ETA, so it self-adjusts in festive weeks.',
    ai: [
      { kind: 'Rules', used: true, text: 'Never-act checks passed.' },
      { kind: 'Statistics', used: true, text: 'Transit at the 96th percentile for this courier lane.' },
      { kind: 'Model', used: true, text: 'Dispute risk 82%, win chance 28%, odds after each action.' },
      { kind: 'Language model', used: true, text: '“need refund” detected in the customer’s WhatsApp. Outbound messages use approved templates only.' },
    ],
    next: 'Pre-empt re-checks the courier scan in 24h. If still stuck, it recommends a re-ship or refund for your review.',
  },
  {
    id: 'ORD-48177',
    amount: 2450,
    method: 'Mastercard · international',
    customer: 'Arjun M.',
    firstOrder: true,
    signals: ['Statement descriptor ‘FTPL*’ does not match brand name', 'First order from this customer'],
    pDispute: 0.61,
    pWin: 0.55,
    recommendedLabel: 'Descriptor clarification via WhatsApp',
    source: 'Model',
    actBy: { when: 'Within 2 days', urgent: false, rank: 1 },
    paidAt: '2026-10-04T22:15',
    quickSignals: ['Bank statement says ‘FTPL*’, not Fashion Tales', 'First order from this customer'],
    topSignal: 'Statement name mismatch on a first international order',
    paymentId: paymentIds['ORD-48177'],
    recommendationReason:
      'Unrecognised-charge risk is a naming problem, not a delivery problem. A clear message costs nothing.',
    options: [
      { id: 'none', label: 'Do nothing', kind: 'none', pAfter: 0.61, expectedCost: 856, actionCost: 0, janImpact: 0 },
      {
        id: 'descriptor',
        label: 'Descriptor message',
        kind: 'message',
        pAfter: 0.2,
        expectedCost: 280,
        actionCost: 0,
        janImpact: -0.02,
        recommended: true,
        message:
          'Hi Arjun, thanks for your Fashion Tales order. Your card statement will show ‘FTPL*FASHIONTALES’ for ₹2,450. That’s us. Team Fashion Tales',
      },
      {
        id: 'refund',
        label: 'Full refund',
        kind: 'refund',
        pAfter: 0.0,
        expectedCost: 2450,
        actionCost: 2450,
        refundAmount: 2450,
        janImpact: -0.03,
        message: 'Hi Arjun, we’ve refunded ₹2,450 in full to your card for your Fashion Tales order. Team Fashion Tales',
      },
    ],
    timeline: [
      { when: 'Sun 4 Oct 22:15', text: 'Paid ₹2,450 · Mastercard · international · first order' },
      { when: 'Mon 5 Oct 14:00', text: 'Shipped · in transit on schedule' },
      { when: 'Tue 6 Oct 15:55', text: 'Pre-empt flagged · dispute risk 61% · win chance 55%', tone: 'flag' },
      { when: '', text: 'Payment signal, not delivery: the 48h dispatch rule doesn’t apply.', muted: true },
    ],
    riskItems: [
      { label: 'Base rate for eligible orders', value: 0.2, base: true },
      { label: 'Statement name mismatch', value: 0.24 },
      { label: 'First order', value: 0.09 },
      { label: 'International card', value: 0.08 },
    ],
    ai: [
      { kind: 'Rules', used: true, text: 'Statement name mismatch (‘FTPL*’ vs Fashion Tales).' },
      { kind: 'Statistics', used: false, text: 'No delivery anomaly to measure.' },
      { kind: 'Model', used: true, text: 'Dispute risk 61%, win chance 55%, odds after each action.' },
      { kind: 'Language model', used: false, text: 'No customer message.' },
    ],
    next: 'No further action unless the customer replies or a dispute arrives.',
  },
  {
    id: 'ORD-48102',
    amount: 980,
    method: 'UPI',
    customer: 'Rohan K.',
    signals: ['Delivered with proof of delivery and OTP', 'Ticket: ‘shirt arrived torn at the seam’, no photo yet'],
    pDispute: 0.44,
    pWin: 0.78,
    recommendedLabel: 'Request photo and build evidence pack. Do not refund.',
    source: 'Model',
    actBy: { when: 'Within 2 days', reason: 'photo pending', urgent: false, rank: 1 },
    paidAt: '2026-10-01T10:05',
    quickSignals: ['Delivered, OTP confirmed', 'Says the shirt arrived torn, no photo yet'],
    topSignal: 'Damage complaint without photo; proof of delivery exists',
    note: 'High win chance: the right move is evidence, not money.',
    paymentId: paymentIds['ORD-48102'],
    recommendationReason:
      'Ask for a photo first. If it shows damage, the fair move is a replacement, which Pre-empt will recommend. If not, the evidence pack is ready.',
    options: [
      { id: 'none', label: 'Do nothing', kind: 'none', pAfter: 0.44, expectedCost: 227, actionCost: 0, janImpact: 0 },
      {
        id: 'evidence',
        label: 'Request photo + evidence',
        kind: 'evidence',
        pAfter: 0.44,
        pWinAfter: 0.85,
        expectedCost: 197,
        costNote: 'Win chance rises to 85%',
        actionCost: 0,
        janImpact: 0,
        recommended: true,
        message:
          'Hi Rohan, sorry to hear your shirt arrived torn. Could you reply with a photo of the shirt and the tear? We’ll sort it out quickly. Team Fashion Tales',
      },
      {
        id: 'credit',
        label: '₹150 credit',
        kind: 'credit',
        pAfter: 0.3,
        expectedCost: 279,
        actionCost: 150,
        refundAmount: 150,
        janImpact: 0,
        message: 'Hi Rohan, sorry your shirt arrived torn. We’ve refunded ₹150 to your account. Team Fashion Tales',
      },
      {
        id: 'refund',
        label: 'Full refund',
        kind: 'refund',
        pAfter: 0.0,
        expectedCost: 980,
        actionCost: 980,
        refundAmount: 980,
        janImpact: 0,
        message: 'Hi Rohan, sorry your shirt arrived torn. We’ve refunded ₹980 in full. Team Fashion Tales',
      },
    ],
    timeline: [
      { when: 'Thu 1 Oct 10:05', text: 'Paid ₹980 · UPI' },
      { when: 'Fri 2 Oct 09:30', text: 'Shipped via surface courier' },
      { when: 'Sun 4 Oct 17:12', text: 'Delivered · proof of delivery and OTP captured', tone: 'ok' },
      { when: 'Tue 6 Oct 12:48', text: 'Support ticket: “shirt arrived torn at the seam” · no photo yet', tone: 'warn' },
      { when: 'Tue 6 Oct 16:05', text: 'Pre-empt flagged · dispute risk 44% · win chance 78%', tone: 'flag' },
    ],
    riskItems: [
      { label: 'Base rate for eligible orders', value: 0.2, base: true },
      { label: 'Damage complaint', value: 0.22 },
      { label: 'No photo yet', value: 0.06 },
      { label: 'Proof of delivery exists', value: -0.04 },
    ],
    ai: [
      { kind: 'Rules', used: true, text: 'Proof of delivery found, so no money. Route to evidence.' },
      { kind: 'Statistics', used: false, text: 'Delivered, so transit time is not a factor.' },
      { kind: 'Model', used: true, text: 'Dispute risk 44%, win chance 78%, odds after each action.' },
      { kind: 'Language model', used: true, text: '“arrived torn” detected in the support ticket.' },
    ],
    next: 'If the photo shows damage, Pre-empt recommends a replacement or exchange for your review. If no photo arrives in 72h, the evidence pack is kept ready for any dispute.',
  },
  {
    id: 'ORD-47990',
    amount: 1290,
    method: 'Visa · debit',
    customer: 'Sana R.',
    signals: [
      'Two charges 40 seconds apart, one order created',
      'Not auto-refunded (duplicate gateway payments are not refunded automatically)',
    ],
    pDispute: 0.91,
    pWin: 0.05,
    recommendedLabel: 'Refund duplicate charge via Razorpay',
    source: 'Rule',
    actBy: { when: 'Act today', reason: 'duplicate charge', urgent: true, rank: 0 },
    paidAt: '2026-10-05T20:31',
    quickSignals: ['Charged twice for one order', 'Extra charge not refunded yet'],
    topSignal: 'Duplicate charge 40 seconds apart',
    reviewReason: 'Refunds above ₹500 always need review',
    paymentId: paymentIds['ORD-47990'],
    recommendationReason:
      'The customer was charged twice. Returning the duplicate removes the dispute reason entirely at ₹0 net loss.',
    options: [
      { id: 'none', label: 'Do nothing', kind: 'none', pAfter: 0.91, expectedCost: 1388, actionCost: 0, janImpact: 0 },
      {
        id: 'dup_refund',
        label: 'Refund duplicate',
        kind: 'refund',
        pAfter: 0.02,
        expectedCost: 31,
        costNote: '₹1,290 refunded · ₹0 net loss (duplicate)',
        displayLoss: { main: '₹0 net loss', sub: '₹1,290 refunded (duplicate)' },
        actionCost: 0,
        refundAmount: 1290,
        janImpact: -0.05,
        recommended: true,
        message:
          'Hi Sana, you were charged twice for order #47990. We’ve refunded the duplicate ₹1,290 to your card; it should show in 5 to 7 working days. Team Fashion Tales',
      },
    ],
    timeline: [
      { when: 'Mon 5 Oct 20:31', text: 'Paid ₹1,290 · Visa · debit (charge 1)' },
      { when: 'Mon 5 Oct 20:31', text: 'Paid ₹1,290 · Visa · debit (charge 2, 40 seconds later) · one order created', tone: 'warn' },
      { when: 'Tue 6 Oct 16:20', text: 'Pre-empt flagged · dispute risk 91% · win chance 5%', tone: 'flag' },
    ],
    riskItems: [
      {
        label: 'Rule: duplicate charge. Risk shown is the historical dispute rate for unrefunded duplicates.',
        value: 0.91,
        base: true,
      },
    ],
    ai: [
      { kind: 'Rules', used: true, text: 'Duplicate charge, no model needed.' },
      { kind: 'Statistics', used: false, text: 'Not needed for a duplicate charge.' },
      { kind: 'Model', used: false, text: 'Not needed: the rule settles it.' },
      { kind: 'Language model', used: false, text: 'No customer message.' },
    ],
    next: 'Refund issued against the duplicate payment. Closed.',
  },
  {
    id: 'ORD-47856',
    amount: 1640,
    method: 'UPI',
    customer: 'Neha P.',
    signals: [
      'Delivery attempt failed twice',
      'Return and refund history: High risk (network buying-history signal, the same one Magic Checkout’s COD Intelligence uses)',
    ],
    pDispute: 0.73,
    pWin: 0.41,
    recommendedLabel: 'Message only. No monetary action.',
    source: 'Model',
    actBy: { when: 'Within 3 days', urgent: false, rank: 2 },
    paidAt: '2026-10-02T13:40',
    quickSignals: ['Delivery failed twice'],
    topSignal: 'Two failed delivery attempts + refund-abuse risk High',
    riskChip: 'Refund-abuse risk: High (network signal)',
    riskChipTooltip:
      'Risk level only, the same signal Magic Checkout’s COD Intelligence uses. No other store’s data is shown.',
    paymentId: paymentIds['ORD-47856'],
    recommendationReason:
      'Fix the delivery, but don’t pay a high refund-abuse risk proactively. A message is the only allowed lever.',
    options: [
      { id: 'none', label: 'Do nothing', kind: 'none', pAfter: 0.73, expectedCost: 925, actionCost: 0, janImpact: 0 },
      {
        id: 'msg',
        label: 'Message only',
        kind: 'message',
        pAfter: 0.55,
        expectedCost: 697,
        actionCost: 0,
        janImpact: 0,
        recommended: true,
        message:
          'Hi Neha, our courier couldn’t deliver your Fashion Tales order after two attempts. Reply with a good time and we’ll re-attempt delivery. Team Fashion Tales',
      },
      {
        id: 'credit',
        label: '₹150 credit',
        kind: 'credit',
        pAfter: 0.45,
        expectedCost: 720,
        actionCost: 150,
        refundAmount: 150,
        janImpact: 0,
        disabledReason: 'Blocked by guardrail',
        message:
          'Hi Neha, sorry about the failed deliveries. We’ve refunded ₹150 to your account and will re-attempt delivery. Team Fashion Tales',
      },
    ],
    timeline: [
      { when: 'Fri 2 Oct 13:40', text: 'Paid ₹1,640 · UPI' },
      { when: 'Sat 3 Oct 10:15', text: 'Shipped via surface courier' },
      { when: 'Mon 5 Oct 18:02', text: 'Delivery attempt 1 failed', tone: 'warn' },
      { when: 'Tue 6 Oct 14:30', text: 'Delivery attempt 2 failed', tone: 'warn' },
      { when: 'Tue 6 Oct 16:10', text: 'Pre-empt flagged · dispute risk 73% · win chance 41%', tone: 'flag' },
    ],
    riskItems: [
      { label: 'Base rate for eligible orders', value: 0.2, base: true },
      { label: 'Two failed delivery attempts', value: 0.33 },
      { label: 'Refund-abuse risk High', value: 0.2 },
    ],
    ai: [
      { kind: 'Rules', used: true, text: 'Money blocked by refund-abuse risk.' },
      { kind: 'Statistics', used: false, text: 'Failed attempts are courier events, not a transit-time anomaly.' },
      { kind: 'Model', used: true, text: 'Dispute risk 73%, win chance 41%, odds after each action.' },
      { kind: 'Language model', used: false, text: 'No customer message.' },
    ],
    next: 'Pre-empt asks the courier for a third attempt and re-checks in 24h.',
  },
];

// Order detail extras for ORD-48213
export const whyFlagged48213 = {
  winReasons: [
    'No proof of delivery yet',
    'Tracking has not moved',
    'The customer contacted the merchant first and got no answer',
  ],
  promiseNote:
    'Money-Back Promise: not yet eligible (the seller has not rejected the customer). Resolving now keeps this order out of a Promise claim.',
};

export type PingStatus = 'awaiting' | 'closed' | 'noreply';

export interface SoftPing {
  id: string;
  amount: number;
  method: string;
  signal: string;
  sent: string;
  status: PingStatus;
  statusText: string;
  customer?: string;
  reply?: string;
  replyTime?: string;
}

export const softPings: SoftPing[] = [
  {
    id: 'ORD-48230',
    amount: 1150,
    method: 'Visa · credit',
    signal:
      'Transit 5.2 days vs lane 90th percentile 5.0 days (91st percentile), no customer contact, dispatched 5 days ago',
    sent: '15:10 today',
    status: 'awaiting',
    statusText: '',
    customer: 'Ananya',
  },
  {
    id: 'ORD-48219',
    amount: 890,
    method: 'UPI',
    signal: 'Transit at the 93rd percentile',
    sent: '11:05 today',
    status: 'closed',
    statusText: 'Closed at ₹0 · courier scan marked stale · lane baseline updated',
    customer: 'Kabir',
    reply: 'Yes, received',
    replyTime: '12:20',
  },
  {
    id: 'ORD-48224',
    amount: 1420,
    method: 'Visa · debit',
    signal: 'Transit at the 92nd percentile',
    sent: '09:40 today',
    status: 'noreply',
    statusText: 'Status message at 09:40 tomorrow · no money',
    customer: 'Meera',
  },
];

export const ping48230 = {
  pDispute: 0.38,
  pWin: 0.3,
  costDoNothing: 420,
  costWithPing: 164,
};

export const pingGuardrails = [
  'Only when a delivery anomaly exists',
  'Once per order',
  'Not within 48h of dispatch',
  'Neutral wording, no offer',
  'Never to blocked segments',
];

export interface Lane {
  lane: string;
  median: number;
  p90: number;
  p96: number;
  vsNormal: string;
}

export const laneBaselines: Lane[] = [
  { lane: 'BLR-560xx surface', median: 3.1, p90: 5.0, p96: 6.2, vsNormal: '+18% (festive)' },
  { lane: 'DEL-110xx air', median: 1.4, p90: 2.3, p96: 2.9, vsNormal: '+9%' },
  { lane: 'MUM-400xx surface', median: 2.8, p90: 4.6, p96: 5.7, vsNormal: '+22% (festive)' },
];

export const templates = [
  {
    name: 'Delay update',
    body: 'Hi {first_name}, your {product} is delayed by our courier. New ETA: {new_eta}. {optional_credit_line} Team Fashion Tales',
  },
  {
    name: 'Descriptor clarification',
    body: 'Hi {first_name}, thanks for your Fashion Tales order. Your card statement will show ‘{descriptor}’ for {amount}. That’s us. Team Fashion Tales',
  },
  {
    name: 'Soft ping',
    body: 'Hi {first_name}, quick check: has your Fashion Tales order #{order_no} arrived?',
  },
];

export const neverAct = [
  'Customer had a refund or dispute in the last 90 days',
  'A human owns an open support ticket on the order',
  'Dispatched less than 48h ago',
  'Proof of delivery or OTP exists (route to evidence instead)',
  'Fraud score is high (hand to Dispute Responder)',
  'A Money-Back Promise claim exists on the payment ID',
];

export const holdoutInfo =
  '10% of flagged orders get no proactive action from Pre-empt. Normal merchant support continues. Pooled across merchants because one merchant’s holdout is too small to measure.';

export const MODEL_VERSION = 'Model v0.3 (synthetic)';

export interface AuditEntry {
  time: string;
  actor: 'Pre-empt' | 'Merchant' | 'Customer';
  order: string;
  action: string;
  amount: number | null;
  paymentId: string;
  why: string;
  decidedBy: string;
  method?: string; // how the recommendation was produced, e.g. "Rule · Statistics · AI model"
}

export const seedAudit: AuditEntry[] = [
  { time: '09:40', actor: 'Pre-empt', order: 'ORD-48224', action: 'Soft ping sent', amount: null, paymentId: paymentIds['ORD-48224'], why: 'Transit at 92nd pct, no customer contact', decidedBy: 'Rule', method: 'Rule · Statistics' },
  { time: '11:05', actor: 'Pre-empt', order: 'ORD-48219', action: 'Soft ping sent', amount: null, paymentId: paymentIds['ORD-48219'], why: 'Transit at 93rd pct, no customer contact', decidedBy: 'Rule', method: 'Rule · Statistics' },
  { time: '12:20', actor: 'Customer', order: 'ORD-48219', action: 'Reply “Yes, received” · closed at ₹0', amount: 0, paymentId: paymentIds['ORD-48219'], why: 'Customer reply to soft ping', decidedBy: 'Rule', method: 'Rule' },
  { time: '13:02', actor: 'Pre-empt', order: 'ORD-48151', action: 'Descriptor message auto-sent', amount: null, paymentId: paymentIds['ORD-48151'], why: 'Statement name mismatch + international card', decidedBy: MODEL_VERSION, method: 'Rule · AI model' },
  { time: '14:15', actor: 'Pre-empt', order: 'ORD-48140', action: 'Credit ₹150 auto-issued', amount: 150, paymentId: paymentIds['ORD-48140'], why: 'Transit at 97th pct + “where is my order” message', decidedBy: MODEL_VERSION, method: 'Rule · Statistics · AI model · Language AI' },
  { time: '15:10', actor: 'Pre-empt', order: 'ORD-48230', action: 'Soft ping sent', amount: null, paymentId: paymentIds['ORD-48230'], why: 'Transit at 91st pct, no contact, dispatched 5 days ago', decidedBy: 'Rule', method: 'Rule · Statistics' },
];

const methodName: Record<AiRow['kind'], string> = {
  Rules: 'Rule',
  Statistics: 'Statistics',
  Model: 'AI model',
  'Language model': 'Language AI',
};

/** Which techniques produced an order's recommendation, for the audit log. */
export const methodOf = (o: QueueOrder) =>
  o.ai
    .filter((r) => r.used)
    .map((r) => methodName[r.kind])
    .join(' · ');

export const skipReasons = [
  'Already handled by support',
  'Customer is known to us',
  'Disagree with risk score',
  'Other',
];

// Percent values are whole numbers (50 = 50%).
export const defaultThresholds = {
  softPingPct: 90,
  softPingDispatchH: 48,
  softPingOn: true,
  msgP: 50,
  msgSignals: 2,
  msgOn: true,
  opsNudgeOn: true,
  creditMax: 200,
  creditP: 70,
  creditWin: 30,
  creditOn: true,
  refundMax: 500,
  refundP: 80,
  refundWin: 20,
  refundOn: true,
  dailyCap: spend.dailyCap,
  weeklyCap: spend.weeklyCap,
};

export type ThresholdKey = keyof typeof defaultThresholds;

export const thresholdMeta: Record<ThresholdKey, { name: string; unit: 'pct' | 'inr' | 'h' | 'n' | 'pctile' | 'bool' }> = {
  softPingPct: { name: 'Soft ping transit percentile', unit: 'pctile' },
  softPingDispatchH: { name: 'Soft ping hours since dispatch', unit: 'h' },
  softPingOn: { name: 'Soft ping auto', unit: 'bool' },
  msgP: { name: 'Proactive message dispute risk', unit: 'pct' },
  msgSignals: { name: 'Proactive message corroborating signals', unit: 'n' },
  msgOn: { name: 'Proactive messages auto', unit: 'bool' },
  opsNudgeOn: { name: 'Ops nudges auto', unit: 'bool' },
  creditMax: { name: 'Partial credit maximum', unit: 'inr' },
  creditP: { name: 'Partial credit dispute risk', unit: 'pct' },
  creditWin: { name: 'Partial credit win chance', unit: 'pct' },
  creditOn: { name: 'Partial credit auto', unit: 'bool' },
  refundMax: { name: 'Refund maximum', unit: 'inr' },
  refundP: { name: 'Refund dispute risk', unit: 'pct' },
  refundWin: { name: 'Refund win chance', unit: 'pct' },
  refundOn: { name: 'Refund auto', unit: 'bool' },
  dailyCap: { name: 'Daily cap', unit: 'inr' },
  weeklyCap: { name: 'Weekly cap', unit: 'inr' },
};
