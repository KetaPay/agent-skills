---
name: ketapay-escrow-lifecycle
description: How a KetaPay escrow moves from funded to completed - milestones, delivery, release, release codes, disputes, flags and who is allowed to do what. Use when building order status pages, seller delivery, buyer release, dispute UI, or any code that acts on an escrow after payment.
license: MIT
metadata:
  version: "0.1.0"
---

# KetaPay escrow lifecycle

An escrow holds the buyer's money until its milestones are released. Your secret key alone can **read** escrows and **flag** one for review. Delivering, releasing and disputing need the right **customer's proof**: KetaPay protects the buyer and seller from the platform as well as from each other.

Docs: https://docs.ketapay.com/escrow/lifecycle, https://docs.ketapay.com/escrow/milestones, https://docs.ketapay.com/after-payment/disputes

## Lifecycle

1. **Funded:** the buyer paid; amounts and milestones are now fixed. Event `escrow.funded`.
2. **Delivered:** the seller marks the current milestone delivered, with an optional note and files. Event `milestone.delivered`.
3. **Released:** the buyer releases it and the seller is paid for that milestone. Events `milestone.released`, then `payout.sent`.
4. **Completed:** every milestone settled. Event `escrow.completed`.

Escrow statuses: `active`, `disputed`, `completed`, `refunded`. Milestones: `funded`, `delivered`, `released`, `refunded`, `disputed`.

## Acting for a customer

Delivering, releasing and requesting changes need the right customer's token (`ketapay-customer-tokens`):

```ts
await ketapay.escrows.milestones.deliver(escrowId, milestoneId, { note: 'Shipped, GIG tracking 88123', attachments: [{ file: file.id }] }, { customerToken: sellerToken })
await ketapay.escrows.milestones.requestChanges(escrowId, milestoneId, { note: 'The logo is the wrong colour' }, { customerToken: buyerToken })
await ketapay.escrows.milestones.release(escrowId, milestoneId, {}, { customerToken: buyerToken })
```

- Milestones go in order: only the current one can be delivered or released (`milestone_not_current`, `milestone_not_delivered`).
- With `release.method: 'buyer_confirms'` the buyer has `inspection_hours` after delivery to release or request changes. If they don't respond, the seller can open a `buyer_unresponsive` dispute after `inspection_ends_at`.
- Up to 20 milestones, adding up to `amount`; once funded the plan can't change.
- Delivery files: [references/files.md](references/files.md).

## Release codes (in-person deals)

With `release.method: 'release_code'`, the buyer gets a 6-digit code per milestone and gives it to the seller on handover. The seller entering it delivers and releases in one step:

```ts
await ketapay.escrows.milestones.release(escrowId, milestoneId, { release_code: codeFromBuyer })
```

- KetaPay sends the code to the buyer by email and WhatsApp or SMS. To show it in your app too: `escrows.milestones.releaseCode(escrowId, milestoneId, { customerToken: buyerToken })`.
- **Show it only to the buyer.** Never log it, send it to the seller's screen or put it in an admin panel.
- Wrong code: `release_code_invalid`; after 5, entry locks for 1 hour (`release_code_locked`) and the buyer is alerted. A disputed milestone can't be released with a code.

## Ending a deal early

- **Before payment:** cancel the checkout session. No money has moved.
- **After payment:** neither side can cancel alone. Either side opens a dispute; the seller can concede, which refunds the buyer everything still held. Money only ever goes back to the account that paid.

## Disputes and refunds

A dispute freezes the milestone; releases fail with `dispute_open` until it ends. Opening, evidence, refunds and chargebacks: `ketapay-disputes-refunds`.

## Flag for review

If you remove a listing as fraudulent or ban a user: `POST /escrows/{id}/flag` (MCP: `flag_escrow`). KetaPay reviews it and may hold releases. The parties are not told who flagged it.

## Find an escrow

Every escrow keeps the session's `external_reference` and `metadata`: `ketapay.escrows.list({ external_reference: 'order_7781' })`.
