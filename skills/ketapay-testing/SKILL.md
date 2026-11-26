---
name: ketapay-testing
description: Test a KetaPay integration end to end in test mode - test keys, the fixed one-time code, paying sessions from code, acting as buyer and seller, test payout accounts and sample webhook events. Use when writing tests or a sandbox walkthrough for KetaPay, seeding test data, or checking a webhook handler before going live.
license: MIT
metadata:
  version: "0.1.0"
---

# Testing KetaPay

Keys that start with `sk_test_` run everything against test money, on the same base URL as live. Every object carries `livemode`. Emails test deals cause have **[TEST]** in the subject.

Docs: https://docs.ketapay.com/testing

## Values

| What | Value |
| --- | --- |
| Customer session code (buyer or seller) | `123456` (no code is sent) |
| Payout account confirmation code | `123456` |
| Payout account that succeeds | `0000000000`, any bank |
| Payout account that fails | `0000000001`, any bank |
| Public docs key (shared, for trying things) | on https://docs.ketapay.com/playground |

## Pay a session

| How | |
| --- | --- |
| From code | `await ketapay.testHelpers.checkoutSessions.pay(session.id)` funds it like a real payment and sends `escrow.funded` |
| Checkout, card | Use a test card the checkout shows in test mode |
| Checkout, bank transfer | Pick **Bank transfer**, then **I've sent the money** |

Test helpers need `test_helpers:write` and fail with `404 test_mode_only` on a live key.

## Move an escrow

Act as both sides with their customer tokens; every step sends its real webhook.

```ts
const token = async (email: string) => {
  const otp = await ketapay.customerSessions.create({ email })
  return (await ketapay.customerSessions.verify(otp.id, '123456')).token
}
const seller = await token('tunde@example.com')
const buyer = await token('ada@example.com')

const escrow = await ketapay.escrows.retrieve(escrowId)
const m = escrow.milestones[0]
await ketapay.escrows.milestones.deliver(escrow.id, m.id, { note: 'Shipped' }, { customerToken: seller })
await ketapay.escrows.milestones.release(escrow.id, m.id, {}, { customerToken: buyer })
```

| To test | Do |
| --- | --- |
| Delivery and release | Seller `deliver`, buyer `release` (or enter the release code) |
| Changes after delivery | Buyer `requestChanges`, seller delivers again |
| A dispute the parties settle | Either opens it; the other concedes, or the opener withdraws |
| A failed payout | Pay the seller to `0000000001` |
| A payout held for verification | Release to a seller you haven't verified, then `ketapay.testHelpers.customers.verify({ customerToken: sellerToken })` |
| A platform ruling | Open a dispute as the buyer, then `ketapay.disputes.resolve(id, { outcome: 'split', refund_amount, reason })` with an `escrows:manage` test key |

The inspection period runs on the clock in test mode too.

## Events you can't cause

A KetaPay ruling, an evidence request, a chargeback, a failed refund: send a signed sample to your endpoint and check your handler.

```ts
const result = await ketapay.webhookEndpoints.test(endpointId, 'dispute.resolved')
// result says what your server answered
```

## In automated tests

- Use a dedicated test key from your secret manager in CI; never a live key.
- Assert on `livemode === false` before anything that would fulfil an order.
- Make test data unique per run (`external_reference: \`test_${runId}\``) so reruns don't collide.
- Before going live, work through `ketapay-money-safety` and https://docs.ketapay.com/integrate/go-live.
