---
name: ketapay-webhooks
description: Receive KetaPay webhook events safely - verify the KetaPay-Signature against the raw body, deduplicate, handle events in any order and test them. Use when writing or debugging a KetaPay webhook endpoint, signature verification, secret rotation, or code reacting to escrow.funded, milestone.released, dispute or payout events.
---

# KetaPay webhooks

KetaPay POSTs each event as JSON with a `KetaPay-Signature` header. Most integrations need one endpoint that receives every event: register it without `enabled_events` and ignore the types you don't handle.

Docs: https://docs.ketapay.com/integrate/webhooks

## Rules

1. **Verify against the raw body, before any JSON parsing.** A parsed-then-restringified body will not match.
2. **Use the library's `verify`**, never a hand-rolled HMAC compare: it checks in constant time and rejects timestamps older than 5 minutes.
3. **Answer `2xx` within 10 seconds.** Do slow work in a background job. Anything else is retried with backoff for 3 days, then the endpoint is marked `failing`.
4. **Deduplicate on the event `id`.** Events can arrive more than once and out of order.
5. **Treat an event as a hint.** Before acting on large amounts, fetch the object (`ketapay.escrows.retrieve(id)`) for its current state.
6. **The signing secret (`whsec_...`) lives in your secret manager**, never in code or logs. The dashboard shows it once.

## Express

```ts
app.post('/webhooks/ketapay', express.raw({ type: 'application/json' }), async (req, res) => {
  let event
  try {
    event = await ketapay.webhooks.verify(req.body, req.header('KetaPay-Signature'), process.env.KETAPAY_WEBHOOK_SECRET!)
  } catch {
    return res.sendStatus(400)
  }
  if (await alreadyHandled(event.id)) return res.sendStatus(200)
  await queue.add('ketapay-event', event) // do the work in the background
  res.sendStatus(200)
})
```

**Next.js route handlers and other edge runtimes:** pass `await request.text()` as the body. Don't call `request.json()` first.

**PHP:** `KetaPay\Webhook::verify(file_get_contents('php://input'), $_SERVER['HTTP_KETAPAY_SIGNATURE'] ?? '', getenv('KETAPAY_WEBHOOK_SECRET'))`. Laravel verifies before listeners run.

## Rotating the secret

After `rotate_secret`, both secrets sign every delivery for 24 hours. Pass both: `verify(body, header, [newSecret, oldSecret])`.

## Events you'll usually handle

| Event | Do |
| --- | --- |
| `escrow.funded` | Mark the order paid (idempotently; the return URL may have done it already) |
| `checkout_session.expired` | Release the reserved stock or cart |
| `milestone.delivered` / `milestone.released` | Update the order's progress |
| `escrow.completed` / `escrow.refunded` | Close the order |
| `dispute.opened` / `dispute.resolved` | Show the dispute state; don't ship further |
| `payout.sent` / `payout.failed` | Tell the seller |

The full list and payloads: https://docs.ketapay.com/integrate/webhooks

## Test it

Send a signed sample: `await ketapay.webhookEndpoints.test(endpointId, 'escrow.funded')` (MCP: `test_webhook_endpoint`). For a real run in test mode, pay a session with `ketapay.testHelpers.checkoutSessions.pay(id)` and watch `escrow.funded` arrive. Local endpoint: expose it with a tunnel and register the tunnel URL.
