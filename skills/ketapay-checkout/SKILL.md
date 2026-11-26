---
name: ketapay-checkout
description: Take a buyer's payment into KetaPay escrow with a checkout session, then confirm it was really paid before fulfilling the order. Use when adding KetaPay payments, a "pay with escrow" button, a checkout session, a return URL handler or order-paid logic to an app.
license: MIT
metadata:
  version: "0.1.0"
---

# KetaPay checkout

A buyer pays into escrow in three steps: your **server** creates a checkout session, the buyer pays on KetaPay's checkout, and your server confirms the payment. KetaPay then holds the money until the seller delivers and the buyer releases it.

Docs: https://docs.ketapay.com/payments/accept-payments and https://docs.ketapay.com/payments/verify-payments. If the KetaPay MCP server is connected, check details with `search_docs` before writing code.

## Rules

1. **Create the session on the server**, when the buyer clicks pay. Price, milestones and parties come from your own records, never from the browser.
2. **Amounts are in kobo** (₦1 = 100 kobo): ₦450,000 is `45_000_000`.
3. **Cards are only collected on KetaPay's checkout.** Redirect to `session.url`, or open it over your page with `@ketapay/checkout` / `@ketapay/react`. Never build a card form.
4. **Reaching `return_url` is not proof of payment.** Anyone can open that URL.
5. **Mark an order paid only** after the `escrow.funded` webhook or after fetching the session and checking it (below). Handle both paths; make fulfilment idempotent so whichever arrives second does nothing.
6. Store `session.id` with the order, and `escrow_id` once paid.

## Create

```ts
import KetaPay from '@ketapay/node'

const ketapay = new KetaPay(process.env.KETAPAY_SECRET_KEY!)

const session = await ketapay.checkoutSessions.create(
  {
    amount: order.amountKobo,
    title: order.title,
    description: order.description,
    buyer: { email: order.buyerEmail },
    seller: { email: order.sellerEmail },
    return_url: `https://shop.example.com/orders/${order.id}`,
    cancel_url: 'https://shop.example.com/cart',
    external_reference: order.reference,
  },
  { idempotencyKey: `checkout_${order.id}` },
)
// redirect to session.url
```

Every field, and the `fees` that come back: [references/session-fields.md](references/session-fields.md). Merchants leave `seller` out; platforms name it (`ketapay-platforms-payouts`).

## Three ways to pay

| | |
| --- | --- |
| Redirect | Send the buyer to `session.url`; they come back to `return_url`. Quickest |
| On your page | Open the same checkout over your page with `@ketapay/checkout` or `@ketapay/react` |
| Your own screen | A one-time account number in your UI, paid by transfer (needs the buyer's customer token) |

The last two: [references/on-your-page-and-transfer.md](references/on-your-page-and-transfer.md).

## Verify on return

```ts
const session = await ketapay.checkoutSessions.retrieve(req.query.checkout_session_id)

const paid =
  session.status === 'complete' &&
  session.external_reference === order.reference &&
  session.amount === order.amountKobo &&
  session.livemode === (process.env.NODE_ENV === 'production')

if (paid) await markOrderPaid(order, session.escrow_id)
```

Every check matters: the session id in the URL could belong to another order or price, and a test payment must never fulfil a live order.

## Statuses

`open` waiting, `complete` paid (`escrow_id` set), `expired` never paid (you get `checkout_session.expired`), `cancelled` you cancelled it.

## Fees

Show the buyer `fees.buyer_total` before they pay. Never hardcode a fee or percentage: read them from the session or `ketapay.pricing.retrieve()` (MCP: `retrieve_pricing`).

## Test it

With an `sk_test_` key, pay a session from code: `await ketapay.testHelpers.checkoutSessions.pay(session.id)`. More in `ketapay-testing`.
