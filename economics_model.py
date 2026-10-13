"""
Pre-empt: economics model for the synthetic merchant "Fashion Tales" (D2C fashion on Shopify and Razorpay).

Every input is an assumption, labelled below. This script reproduces the
numbers used in the one-pager, prototype and video. Run: python3 economics_model.py
"""

# --- Synthetic merchant (assumptions) ---------------------------------------
DISPUTES = {"unrecognised": 10, "late": 20, "not_as_described": 12, "fraud": 8}  # per month
AOV = 1200            # average order value, INR
P_LOSE = 0.65         # share of disputes the merchant loses
OPS = 300             # ops time per dispute, INR (about 30 minutes)
FEE = 0               # chargeback-stage fee: Nil per Razorpay docs
CARD_TX = 3750        # card transactions per month (30% of 12,500 orders)
CARD_DISPUTES = 30    # card dispute ratio 0.80%
JAN_WITHOUT = 1.70    # January ratio after Diwali, assumes November card volume 2.1x normal
CREDIT = 150          # goodwill credit, INR
BASE_PREVENTION = {"unrecognised": 0.60, "late": 0.55, "not_as_described": 0.50}


def scenario(name, recall, precision, prevention_mult, soft_ping, holdout=0.10):
    cost_per_dispute = P_LOSE * (AOV + FEE) + OPS
    # Not-as-described: a refund costs about the same as losing, so only ops time is saved.
    value = {"unrecognised": cost_per_dispute, "late": cost_per_dispute,
             "not_as_described": OPS + P_LOSE * FEE}
    acted = 1 - holdout
    prevented = {k: DISPUTES[k] * recall * BASE_PREVENTION[k] * prevention_mult * acted
                 for k in BASE_PREVENTION}
    gross = sum(prevented[k] * value[k] for k in prevented)

    flagged_late = DISPUTES["late"] * recall / precision
    # Credits go to half of flagged late orders. With the soft ping, half of the
    # orders that would never have disputed reply "Yes, received" and get nothing.
    share = 0.5 * (precision + (1 - precision) * 0.5) if soft_ping else 0.5
    credits = flagged_late * share * CREDIT * acted

    total_prevented = sum(prevented.values())
    card_prevented = total_prevented * CARD_DISPUTES / sum(DISPUTES.values())
    ratio_after = (CARD_DISPUTES - card_prevented) / CARD_TX * 100
    jan_after = JAN_WITHOUT * (CARD_DISPUTES - card_prevented) / CARD_DISPUTES
    print(f"{name:<34} prevented {total_prevented:5.1f}/mo | credits Rs {credits:6,.0f} | "
          f"net Rs {gross - credits:7,.0f}/mo | ratio 0.80% -> {ratio_after:.2f}% | "
          f"January {JAN_WITHOUT:.2f}% -> {jan_after:.2f}%")


def expected_cost(p_dispute_after, amount, p_win, action_cost=0):
    """Expected cost = P(dispute after action) x [(1 - P(win)) x order value + ops] + action cost."""
    return p_dispute_after * ((1 - p_win) * amount + OPS) + action_cost


if __name__ == "__main__":
    print("Scenarios (synthetic):")
    scenario("Base (recall 75%, precision 33%)", 0.75, 0.33, 1.0, True)
    scenario("Base without soft ping", 0.75, 0.33, 1.0, False)
    scenario("Conservative (60%, 25%, x0.6)", 0.60, 0.25, 0.6, True)

    print("\nORD-48213 option costs (Rs 1,290, P(dispute) 0.82, P(win) 0.28):")
    for label, p_after, act in [("Do nothing", 0.82, 0), ("Message only", 0.43, 0),
                                ("Message + Rs 150 credit", 0.13, CREDIT)]:
        print(f"  {label:<26} Rs {expected_cost(p_after, 1290, 0.28, act):,.0f}")
    print(f"  {'Full refund':<26} Rs 1,290")
