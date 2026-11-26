---
name: ketapay-customer-tokens
description: Let buyers and sellers act on KetaPay escrows from your own UI by verifying them with a one-time code and using the 15-minute customer token. Use when building release, delivery, dispute, bank-transfer or payout-account screens in your app, or when a KetaPay call fails with customer_token_required, customer_token_expired or customer_not_allowed.
license: MIT
metadata:
  version: "0.1.0"
---

# Customer tokens

Your secret key alone never moves escrowed money. Paying by transfer in your own UI, delivering, releasing, requesting changes, disputes, evidence and payout accounts are your **customer's** decisions, so those calls also need proof that the right customer approved them: a customer token.

Docs: https://docs.ketapay.com/customers/customer-tokens

## Flow

```ts
// 1. KetaPay sends a one-time code to the customer's email, or phone (WhatsApp, falling back to SMS)
const otp = await ketapay.customerSessions.create({ email: 'ada@example.com' })

// 2. Your UI collects the code; your server exchanges it for a token
const { token } = await ketapay.customerSessions.verify(otp.id, codeTheyTyped)

// 3. Send it with your secret key (the SDK sets the KetaPay-Customer-Token header)
await ketapay.escrows.milestones.release(escrowId, milestoneId, {}, { customerToken: token })
```

## Rules

- Valid for **15 minutes**, only on escrows where that person is the buyer or the seller, and only with the secret key that created it.
- KetaPay checks the role: only the buyer releases or requests changes, only the seller delivers. Anyone else gets `403 customer_not_allowed`.
- **Keep the token on your server** (in the user's server-side session), never in the browser, never logged, never shared with another customer. Treat it as a password for its 15 minutes.
- Verify the person who is signed in to your app, with the contact on the escrow. Don't let a signed-in seller request a code for the buyer's email.
- Expired: `customer_token_expired`; missing: `customer_token_required`. Send a new code and retry.
- Wrong code: `code_invalid`; expired code: `code_expired`; too many tries: `too_many_attempts`. Show a plain message and let them request a new code.
- In test mode no code is sent and every code is `123456`.

## Who does what

| Action | Who verifies |
| --- | --- |
| Pay by bank transfer on your screen | Buyer |
| Deliver a milestone, upload delivery files | Seller |
| Release, request changes, see the release code | Buyer |
| Open a dispute, submit evidence, escalate | Buyer or seller |
| Concede a dispute | Seller |
| Withdraw a dispute | Whoever opened it |
| Add, confirm or remove a payout account | Seller |

A release-code escrow is the exception for release: the seller enters the buyer's 6-digit code and needs no buyer token (see `ketapay-escrow-lifecycle`).

## Never

- Never store a token for later or reuse it across customers.
- Never have an AI agent, cron job or support tool hold a customer token on someone's behalf. These are the customer's own decisions.
