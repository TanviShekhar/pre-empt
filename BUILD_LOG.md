# Pre-empt: AI build log

**Tanvi Shekhar · ISB PGP 2027 · Razorpay AI x PM Build Challenge, Track 2 (AI Product Manager) · 13 Oct 2026**

- **Live prototype:** https://pre-empt.vercel.app (no login needed)
- **Code:** https://github.com/TanviShekhar/pre-empt

Pre-empt is a concept agent for Razorpay Agent Studio. It predicts which shipped, paid orders will turn into chargebacks, and takes the cheapest action that prevents them before the customer goes to the bank. The sample merchant, **Fashion Tales** (D2C fashion on Shopify and Razorpay), and all of its orders and figures are synthetic.

---

## 1. AI tools and models used

| Tool | Model | What I used it for |
|---|---|---|
| Claude (Anthropic), chat and agent sessions | Claude Sonnet 5.5, Claude Opus 5 / 5.5 | Reading Razorpay's public AI pages; generating and stress-testing ideas; critiquing my deck against the rubric; checking facts against primary sources; auditing the economics in Python; drafting the product note, the prototype specification and the edit prompts |
| Gemini (Google) | Gemini app (version not recorded) | Independent second-opinion review of my deck; proposed the "soft ping" idea |
| Claude Code (Anthropic) | Claude, in Claude Code | Building the React prototype from my specification, applying my revision prompts, deploying to Vercel and publishing this repo |
| Claude, Playwright, ffmpeg | n/a | Video: recorded from the live prototype with a scripted browser. Claude helped with the script, storyline and example numbers. I recorded the voiceover myself |

## 2. Workflow

1. **Understand the brief and Razorpay's direction.** Read the Agentic Dashboard, Agent Studio, RAY on WhatsApp and Vulcan pages, and summarised what each does and where it stops.
2. **Generate and kill ideas.** Rejected failed-payment recovery as too predictable. Chose dispute **prevention**, because every dispute tool I could find acts after the customer has escalated.
3. **Talk to merchants.** Spoke with a few D2C founders who sell on Razorpay about how disputes reach them and what they do today. Their answers shaped the problem: they hear about a dispute only after it is filed, "I don't recognise this charge" disputes keep coming, and they handle complaints by hand on WhatsApp. I also found Customer Trust (Money-Back Promise), the closest existing product, and repositioned against it. Whether sellers can see their own dispute ratio today is an assumption I have not verified.
4. **Cross-model critique.** Had Gemini and Claude review the deck independently. I judged each claimed weakness before reading the proposed fixes, then decided between them.
5. **Verify facts against primary sources.** Razorpay's chargeback-fee docs, the Money-Back Promise terms and FAQs, a summary of Visa's VAMP rules, and follow-up questions back to the founders.
6. **Audit the numbers.** Rebuilt the economics in Python ([`economics_model.py`](economics_model.py)) with recall, precision, holdout, and base vs conservative cases. Made every number consistent across the one-pager, prototype and video.
7. **Specify, build, review, revise.** Wrote a detailed specification (screens, synthetic data, interactions, demo path, acceptance checklist), built it in Claude Code, then reviewed every screen myself and sent a 48-item edit prompt rather than a rebuild.
8. **Ship.** Claude Code built, deployed to Vercel, checked the public URL returned HTTP 200, scanned for secrets, and pushed this repo using my GitHub noreply email.
9. **Video.** Recorded from the live prototype. Material that is not in the product (where Pre-empt sits, the AI-vs-rules split, the simulated customer reply, the 3-month projection) appears as labelled overlays. I recorded the voiceover myself.

## 3. Key prompts and agent setup (abridged)

- "Rate this idea against the challenge rubric. Where is it weak, should I go ahead, and is there anything better?"
- "Here are screenshots of everything Razorpay ships today. Does anything already solve this? How much overlap?"
- "Here is another model's critique. Decide first whether these are real vulnerabilities. Only then look at its proposed fixes."
- "List every assumption we are making, and turn each one into a question I can check with founders."
- "Criticise the prototype as much as you can. It should look realistic, without copying Razorpay's branding."
- "Give me a prompt that makes all these changes in the most detailed manner. Don't rebuild."
- "Build, deploy to Vercel production, check the URL is public, check nothing secret is committed, then publish a public repo."

**Agent setup:** one long Claude session held the research, the decisions and the specification. Claude Code worked only inside the project folder, and every change went through a written prompt that I reviewed first. The prototype and all of its data are synthetic.

## 4. AI output I rejected, corrected or improved

**Main example: the economics.** My first deck, drafted with AI help, claimed the agent would save the sample merchant about ₹27,200 a month. That rested on three hidden assumptions:
- a ₹500 fee per dispute;
- the agent catching every dispute-to-be (100% recall);
- credits only ever going to customers who would actually dispute (100% precision).

I had the figures audited. Razorpay's fee docs list the chargeback-stage fee as Nil. A realistic model (75% recall, 33% precision, 10% holdout) gives about **₹11,600 a month, or ₹4,500 in a conservative case**. Rather than hide the smaller number, I changed the pitch from "savings" to **dispute-ratio headroom**, which the corrected model still supports (0.80% falls to 0.55%).

| AI output | What I did | Why |
|---|---|---|
| Gemini: make courier "latency buffers" merchant-configurable | Rejected. Lateness is measured against each courier lane's live transit distribution instead | A typed-in threshold is just a rule. It contradicts the reason for using AI, and merchants have no basis for the number |
| Gemini: open the prototype with a chat box | Rejected | The brief warns against chatbots, and it would hide the decision screen |
| Gemini: ask the customer "has your order arrived?" before spending | Accepted, then added guardrails: only when a delivery anomaly already exists, once per order, neutral wording, no offer | A ping can provoke a complaint that would never have happened |
| Gemini: "Magic Checkout processes millions of shipments" | Rejected | Magic Checkout is a checkout product. Network delivery data is better evidenced by COD Intelligence |
| Gemini, on the final one-pager: a WhatsApp soft ping is not really ₹0 | Accepted. The one-pager now calls it near-zero (one utility message) | Unit economics should survive a pedantic reviewer |
| Gemini: at 33% precision, two of three flagged orders are false alarms, so merchants may rubber-stamp the queue | Accepted. Added queue thresholds, one-click ₹0 approvals, and a pause if the override rate climbs | Review fatigue would quietly break the human-in-the-loop design |
| Gemini: "top 1% tier product writing" | Ignored, and rewrote the one-pager in plainer language anyway | Praise is not evidence; the page read as dense and machine-written |
| Early framing: Visa's 1.5% line threatens this merchant | Corrected to the 0.7% acquirer-portfolio line | The 1.5% merchant line only applies at 1,500+ fraud and dispute events a month |
| Early draft named Shiprocket, Freshdesk and Slack as data sources | Replaced with connectors Agent Studio lists publicly (Shopify, Fynd, WhatsApp tools) | Avoid implying integrations that don't exist |
| Sample merchant named "Kaya Botanicals" | Renamed, and later switched to a fashion merchant, Fashion Tales | Kaya Limited is a real listed Indian skincare company |
| Claude: "open the 'Reduce Losses' tab" | Found it was only a marketing image, so I did not rely on it | Claims about what Razorpay ships today rest on its public pages and founder conversations, and are listed as unverified in the limitations |
| Deck numbers contradicted each other (14 flagged a day vs 50 disputes a month; a 2.1% holdout dispute rate vs risk scores of 0.82) | Rebuilt one consistent synthetic dataset | Probabilities shown to merchants must be internally coherent |
| First prototype: Razorpay-style logo, top banner, "demo time" label, pitch chips | Removed. Kept a dashboard layout, "Agent Studio" in plain text, and a footer-only disclaimer | It should feel real without implying it is an official Razorpay product |
| Claude's first video script ran about 95 seconds read aloud | Cut about 10 filler words and kept every point | The limit is 90 seconds |
| First automated recording clicked "See January projection" while the page was still scrolling, so nothing happened | Caught by checking frames, made the click re-aim until the button stopped moving, then re-recorded | The video must show the real product working |

## 5. What AI did vs what I decided

| AI did | I decided or did myself |
|---|---|
| Read and summarised Razorpay's public pages | The problem, the merchant segment, and prevention over defence |
| Generated and critiqued idea options | Dropping the first idea as too predictable |
| Audited the arithmetic and ran scenarios | Founder conversations; finding Money-Back Promise |
| Drafted documents, the prototype spec and edit prompts | Reading the fee docs and the Promise terms myself |
| Built, deployed and published the prototype (Claude Code) | Which critiques to accept, reject or modify |
| Helped with the video script and example numbers | Every screen review, plus the realism and branding calls |
| | Guardrails, exclusions, and where AI is and isn't used |
| | Removing the "presenter mode" from the live prototype so the link shows exactly what a merchant would see, and moving pitch-only material into labelled video overlays |
| | Final wording, numbers, the demo story and the voiceover |

**Where AI is and isn't used in the product itself:**
- **Rules (no AI):** duplicate charges, statement-name mismatch, caps, never-act checks.
- **Statistics:** courier-lane transit percentiles, which self-adjust in festive weeks.
- **Machine learning:** P(dispute), P(merchant wins), and the odds after each action.
- **Language model:** reads inbound customer messages for refund intent only. Outbound messages use approved templates.

## 6. What the prototype does beyond the 90-second video

The video shows one order end to end. The live prototype also has:

- **Review queue:**
  - Sort and filter.
  - "Act by" urgency chips.
  - "Approve all ₹0 actions" in one click. Money-moving actions always need one-by-one review.
  - Edit a message within approved templates.
  - Skip with a reason, which is logged as a merchant override.
- **More order types:**
  - A duplicate charge refunded by a rule, not a model. Refunds above ₹500 always need review.
  - A statement-name mismatch ("FTPL*" vs Fashion Tales) fixed with a ₹0 message.
  - A damage claim with proof of delivery, where Pre-empt requests a photo and builds evidence instead of refunding.
  - A high refund-abuse customer, where credit is blocked by a guardrail.
- **Order detail:**
  - "Why the win chance is only 28%".
  - A Money-Back Promise eligibility note.
- **Soft pings:** a ₹0 "has it arrived?" WhatsApp question before any money moves. Guardrails: only when a delivery anomaly already exists, once per order, not within 48h of dispatch, neutral wording with no offer. The table shows awaiting, replied and no-reply states, and a "why a ping, not money" breakdown for the selected order.
- **Controls:**
  - Modes: recommend-only, review-first, auto within limits.
  - Automation thresholds.
  - Daily and weekly caps, with a festive sale mode that doubles them.
  - Locked never-act rules.
  - Approved templates.
  - Courier-lane baselines (overrides are logged).
  - A one-tap pause.
- **Audit log:** every automatic action, merchant decision, customer reply and override, against the payment ID, tagged with the method used (Rule, Statistics, Model, Language model).
- **How it works:** a 7-step guided tour, available from the header on every screen and from a dismissible banner on the Overview.

**Shown in the video and this log, not in the product** (pitch material, kept out of the merchant screens on purpose):
- **Where Pre-empt sits:** checkout tools (Magic Checkout with COD Intelligence, RTO Shielder) act before shipping; Money-Back Promise acts only after the seller rejects the customer; Dispute Responder acts after filing. Pre-empt acts after shipping and before escalation.
- **Where AI is and isn't used** for one order: rules for never-act checks, lane statistics for lateness, ML for risk and win odds, a language model only to read the customer's message.
- **Measured against a holdout:** 10% of flagged orders get no proactive action. Illustrative result: 33% of holdout orders disputed vs 15% treated; net cost per flagged order ₹356 vs ₹186.
- **3-month projection (synthetic):** card ratio 0.80% to 0.55% (conservative 0.68%); January 1.70% to 1.17% (1.45%); net saving about ₹11,568 (₹4,507) a month.
- **How it learns before 90 days:** soft-ping reply (minutes), message acknowledged (72h), delivery after a delay flag (7 days), no new ticket (7 days), merchant approvals and overrides (weekly); ground truth arrives in 45 to 120 days.
- **Kill criteria:** pause if treated net cost exceeds holdout for 2 months running, if ping opt-outs or complaints pass the agreed level, or if merchants override more than 40% of recommendations.

## 7. Known limitations, risks and verification

**Limitations and risks**
- **Synthetic data:** the merchant and all of its figures are invented. The prototype has no backend, and its state resets on reload. Customer replies to soft pings are not simulated in the live prototype; the video shows one as a labelled overlay.
- **Assumed model parameters:** recall 75%, precision 33%, prevention 50 to 60%, November card volume 2.1x, soft-ping reply rates. Only a pilot can confirm these.
- **Third-party source:** the VAMP thresholds come from a third-party summary of Visa's rules. India is assumed to sit in Visa's Asia-Pacific region.
- **Small sample:** the founder conversations were a handful of D2C brands, not a survey. Several points (ratio thresholds, network monitoring) are not documented publicly by Razorpay, and whether sellers can see their own dispute ratio today is an assumption to check.
- **Agent Studio internals can't be verified:** it is in beta and not covered in Razorpay's support docs. Whether the Shopify connector passes delivery events is assumed.
- **UPI:** if UPI disputes are mostly payment failures, rupee savings fall (about 0.6x), but the card-ratio result does not change.
- **Money-Back Promise funding** is not public.
- **Risks the design guards against:** refund farming, refunding winnable orders, double refunds, provoking complaints, and over-refunding drift.

**Verification steps taken**
- Razorpay chargeback-fee docs.
- Money-Back Promise terms and FAQs.
- Founder conversations, with follow-up questions.
- Calendar checks on every date in the demo.
- Arithmetic re-run in Python: `python3 economics_model.py` reproduces every figure.
- One-page check on the one-pager.
- Public URL check (HTTP 200, no login).
- Secret scan before publishing.
- Video frames checked against every number in the script.

## 8. Privacy

This log and repo contain no API keys, credentials or customer data. Vercel's local token file (`.env.local`) is git-ignored and was never pushed. Commits use a GitHub noreply address. Founders are not named.
