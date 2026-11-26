---
name: ketapay-disputes-refunds
description: Handle what happens when a KetaPay deal goes wrong - disputes (open, evidence, concede, withdraw, escalate, outcome), platforms deciding their customers' disputes, refunds with an escrows:manage key, money actions and card chargebacks. Use when building dispute or refund screens, back-office refund tools, or code reacting to dispute.*, escrow.refunded, refund.* or chargeback.* events.
license: MIT
metadata:
  version: "0.1.0"
---

# Disputes, refunds and chargebacks

Docs: https://docs.ketapay.com/after-payment/disputes, https://docs.ketapay.com/after-payment/refunds, https://docs.ketapay.com/after-payment/chargebacks

## Disputes

Either side can open one, on KetaPay's pages or through your UI: the buyer when something wasn't delivered as agreed, the seller when the buyer won't release or respond. A dispute freezes the milestone it covers (one open dispute per milestone at a time).

**Who decides:** KetaPay, on a merchant's own sales. **The platform**, on a deal between two of its customers, under its own published policy (below). A platform never touches its customers' deal until one of them raises a dispute.

```ts
await ketapay.disputes.create(
  escrowId,
  { milestone_id: milestoneId, reason: 'not_as_agreed', description: 'Screen is cracked.' },
  { customerToken: buyerToken },
)
```

- Buyer reasons: `not_received`, `not_as_agreed`, `damaged`, `incomplete`. Seller: `buyer_unresponsive` (only after the inspection period; `inspection_not_over` before `inspection_ends_at`). Either: `other`.
- **Settling without KetaPay:** the buyer can release; the seller can `concede` (refunds the buyer that milestone); whoever opened it can `withdraw`. Either side can `escalate` to ask for a decision now (KetaPay's, or the platform's on its customers' deal), after which neither can settle. Nobody can settle in their own favour.
- **Evidence:** upload each file with `files.create({ purpose: 'dispute_evidence' }, { customerToken })`, then `disputes.submitEvidence(id, { statement, files: [file.id] }, { customerToken })` (statement 10 to 2000 characters, up to 10 files). Both sides have 72 hours; `awaiting_evidence_from` and `evidence_due_at` say who and by when. Late evidence is still taken. Or send people to the dispute room at the dispute's `url`.
- Evidence is visible to the two parties, KetaPay and the platform deciding the dispute (`disputes.listEvidence(id)` with the platform's key). Otherwise your key alone can't read it.
- While a dispute is open, releases fail with `dispute_open`. Show that state; don't retry.
- **Outcome** (`dispute.resolved`): `released`, `refunded`, `partially_refunded` (a split, with `refunded_amount`) or `withdrawn`; `resolved_by` says who decided.

## Platforms decide their customers' disputes

```ts
await ketapay.disputes.resolve(disputeId, {
  outcome: 'split', // 'release' | 'refund' | 'split'
  refund_amount: 3_000_000, // split only: back to the buyer, in kobo; the seller gets the rest
  reason: 'The screen arrived cracked; our policy refunds 30% for cosmetic damage.',
})
```

- Needs an `escrows:manage` key (or the business dashboard). `reason` is 10 to 2000 characters and is kept with the record of who decided.
- `release` pays everything in dispute to the seller; `refund` returns everything still held to the buyer; `split` must leave both sides something.
- What is in dispute is the milestone for a milestone dispute, or everything still held. It works while the dispute is open or under review, and no deadline takes it away from the platform.
- The answer is a money action (`ruling_release`, `ruling_refund`, `ruling_split`); the dispute ends with `resolved_by: 'platform'`.
- Refused with `not_the_decider` on the platform's own sales (KetaPay decides those), and with `rulings_paused` while KetaPay has paused the platform (KetaPay then decides its open disputes).
- Build the ruling into a staff tool with your own approval step, show both sides' evidence first, and publish the policy you rule by.

Prompt the right person on `dispute.opened` and `dispute.evidence_requested`.

## Refunds

The buyer is refunded when you refund a deal yourself, the seller concedes, or KetaPay decides for the buyer.

```ts
const refund = await ketapay.escrows.refund(escrowId, { reason: 'Out of stock, agreed with the buyer by phone' })
const action = await ketapay.moneyActions.retrieve(refund.id) // where it stands
```

- Needs a key with `escrows:manage`, which is never added to an existing key. Keep that key in the one back-office system that refunds, behind your own staff approval.
- Your key refunds **your own sales** only. A platform can't refund a deal between its customers: `POST /escrows/{id}/refund` answers `403 dispute_required`; only the buyer and seller end it, unless one raises a dispute for the platform to decide.
- Every refund is a **money action** recording which key did it and why. Write a real reason.
- Money goes to the buyer's KetaPay balance at once (`destination: ketapay_balance`); refunds back to the card or bank are not live during the beta.
- The buyer gets the refunded amount back in full. KetaPay keeps its whole fee once the escrow is funded: the seller side's share for the refunded part comes from your business balance (which can go below zero and is recovered from your next commission or sale). No commission is charged on refunded money.
- Events: `escrow.refunded`, `refund.sent` (`refund.failed` not sent during the beta).
- A paid escrow can't be cancelled by one side. Before payment, cancel the checkout session instead.

## Chargebacks

A buyer asking their card bank to reverse a payment. KetaPay contests every one with the evidence the escrow already holds; you never need to act.

- Before release the affected milestones freeze; after release, if lost, the amount is recovered from the seller and your commission on it is reversed.
- The seller may add evidence: `chargebacks.submitEvidence(id, { statement }, { customerToken: sellerToken })` until `respond_by` (`chargeback_not_open` after).
- Events `chargeback.opened` and `chargeback.closed` are not sent during the beta; test your handler with `webhookEndpoints.test(id, 'chargeback.opened')`.

## AI agents

An agent never refunds or rules on its own word. Through the KetaPay MCP server, a refund waits for a person to confirm it on a KetaPay page with their security code; platform rulings are not an agent tool.
