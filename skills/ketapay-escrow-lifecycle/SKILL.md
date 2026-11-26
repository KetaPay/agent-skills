---
name: ketapay-escrow-lifecycle
description: How a KetaPay escrow moves from funded to completed - milestones, delivery, release, release codes, disputes, flags and who is allowed to do what. Use when building order status pages, seller delivery, buyer release, dispute UI, or any code that acts on an escrow after payment.
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

KetaPay sends the customer a one-time code; your server exchanges it for a 15-minute customer token and passes it on the call:

```ts
const otp = await ketapay.customerSessions.create({ email: seller.email })
const { token } = await ketapay.customerSessions.verify(otp.id, codeTheyTyped)

await ketapay.escrows.milestones.deliver(escrowId, milestoneId, { note: 'Shipped, GIG tracking 88123' }, { customerToken: token })
```

- Keep customer tokens on the server and never log them.
- Use the **buyer's** token to release, the **seller's** to deliver. Never let one side act as the other.
- An AI agent or background job must never hold a customer token for someone. That is the customer's decision.

## Release codes (in-person deals)

With `release.method: 'release_code'`, the buyer gets a code and gives it to the seller on handover. **Show the release code only to the buyer.** Never log it, email it to the seller or put it in an admin panel.

## Ending a deal early

- **Before payment:** cancel the checkout session. No money has moved.
- **After payment:** neither side can cancel alone. Either side opens a dispute; the seller can concede, which refunds the buyer everything still held. Money only ever goes back to the account that paid.

## Disputes

A dispute is a request for a refund (full or part). While one is open, release calls fail with `dispute_open` (a `ConflictError`). Show that state instead of retrying. Handle `dispute.opened` and `dispute.resolved`, and read the dispute docs for who decides and the evidence deadlines.

## Flag for review

If you remove a listing as fraudulent or ban a user: `POST /escrows/{id}/flag` (MCP: `flag_escrow`). KetaPay reviews it and may hold releases. The parties are not told who flagged it.

## Find an escrow

Every escrow keeps the session's `external_reference` and `metadata`: `ketapay.escrows.list({ external_reference: 'order_7781' })`.
