# Checkout on your page, and bank transfer on your screen

## Checkout on your page

Same checkout as the redirect, opened over your page (a window on desktop, full screen on phones). Source: https://docs.ketapay.com/payments/checkout-on-your-page

Server: create the session as usual and send only its `url` to the browser, never the key or the whole session.

```ts
app.post('/api/checkout', async (req, res) => {
  const session = await createSessionFor(req.body.orderId) // server-side price and parties
  res.json({ url: session.url })
})
```

Browser:

```js
import { KetaPay } from '@ketapay/checkout'
KetaPay.open({ url, onSuccess: () => showThankYou(), onError: () => showMessage('Checkout could not load.') })
```

React: `<KetaPayButton url={() => fetch('/api/checkout', { method: 'POST' }).then((r) => r.json()).then((s) => s.url)} onSuccess={...}>Pay safely with KetaPay</KetaPayButton>`.

- `onSuccess` can't prove a payment (anyone can call it from the console). Ship only after `escrow.funded` or a fetched, checked session.
- With a `return_url`, the receipt shows a **Back to** button that navigates the whole page; leave it out to move the buyer on yourself in `onSuccess`/`onClose`.
- Content Security Policy: `frame-src https://checkout.ketapay.com; script-src https://js.ketapay.com;`

## Bank transfer on your screen

For apps with their own payment screen: a one-time account number for the session; transferring the exact amount funds the escrow. Cards are never taken this way. Source: https://docs.ketapay.com/payments/bank-transfer

1. Create the checkout session.
2. Verify the buyer with a customer token (`ketapay-customer-tokens`): the payer is verified before money is taken.
3. Get the account details and show them:

```ts
const transfer = await ketapay.checkoutSessions.bankTransfer(session.id, { customerToken: buyerToken })
```

| Error | Do |
| --- | --- |
| `verification_required` | The amount is above the buyer's verification level: send them to the session's `url` to verify and pay there |
| `409` state conflict | Already paid, cancelled or expired: fetch the session |
| `403` not a party | The token belongs to someone who isn't the buyer |
| `payment_method_not_allowed` | Bank transfer is off in your checkout settings |
| `transfer_not_available` | Live bank transfers are not open yet: use the checkout |

Confirm the payment with `escrow.funded` or a fetched session, as for any checkout.
