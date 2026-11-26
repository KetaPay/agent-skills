---
name: ketapay-platforms-payouts
description: Build a KetaPay marketplace (platform) where your customers sell to each other - getting approved, naming the seller, your commission, deciding your customers' disputes, seller identity verification, and the payout account sellers are paid to. Use when building a marketplace, freelance or property platform on KetaPay, a seller onboarding or payout-account screen, commission settings, or handling payout.sent and payout.failed.
license: MIT
metadata:
  version: "0.1.0"
---

# Platforms and payouts

A platform is a marketplace where your customers buy from each other. The buyer pays into escrow, the seller is paid into their own payout account, and your business earns a commission on each release without ever being a party to the deal.

Docs: https://docs.ketapay.com/merchants-and-platforms, https://docs.ketapay.com/after-payment/payouts, https://docs.ketapay.com/payments/fees

## Getting approved

- Every business starts as a merchant. Email developers@ketapay.com to switch **test mode** to platform and build straight away.
- **Live** needs KetaPay's approval: apply in **Compliance** on the dashboard. Until then, naming a seller is refused with `403 platform_not_approved`.
- KetaPay can pause a platform; while paused, its rulings fail with `rulings_paused` and KetaPay decides its open disputes.

## Name the seller

```ts
const session = await ketapay.checkoutSessions.create({
  amount: 250_000,
  title: 'Logo design, 3 concepts',
  description: 'Three concepts, two rounds of changes, source files.',
  buyer: { email: 'ada@example.com' },
  seller: { phone: '+2348012345678', name: 'Tunde Studio' },
  commission: { rate_bps: 1000 }, // 10%, from the seller's side
  external_reference: 'order_1042',
})
```

- `buyer` and `seller` each need an email or a phone (`contact_required`), and must be different people (`parties_must_differ`). Phones are `+234` format.
- Leave `seller` out on your own sales (you're then the seller, paid to your KetaPay balance).

## Commission

- `commission: { rate_bps, min_amount, max_amount }`: basis points (`1000` = 10%), floor and cap in kobo over the whole escrow.
- Leave it out to use your account's default; `null` for none on this escrow.
- It comes from the seller's side of each release, never from the buyer, and is never charged on refunded money.
- Above your agreed maximum: `commission_exceeds_contract`.
- Read the real figures from `fees` (`commission`, `seller_payout`), never compute them yourself.

## Seller payout accounts

Only the seller can add the account they are paid to, by confirming a one-time code. Not your platform, your staff, anyone with your key, or KetaPay staff.

```ts
const banks = await ketapay.banks.list() // for your bank picker

const account = await ketapay.payoutAccounts.create(
  { bank_code: '058', account_number: '0123456789' },
  { customerToken: sellerToken },
) // KetaPay looks up the name and sends the seller a code naming the bank and last 4 digits

await ketapay.payoutAccounts.confirm(account.id, codeTheyTyped, { customerToken: sellerToken })
```

- Show the looked-up account name before the seller confirms. Unknown account: `bank_account_not_found`.
- Accounts can't be edited: add a new one and confirm it; remove old ones with `payoutAccounts.del`.
- Never collect a seller's bank details in your own database for KetaPay, and never let staff add an account for a seller.

## Payouts

- Each release is paid to the seller's active payout account automatically. Not verified yet, no account yet, or a failed transfer: the money waits in their KetaPay balance and goes as soon as the step is done.
- Each milestone's `payout.status`: `awaiting_verification`, `awaiting_account`, `processing`, `sent` or `failed`.
- `payout.sent`: it reached the bank. `payout.failed`: it stays in the seller's balance; prompt them to check or add an account.
- Test mode: account `0000000000` (any bank) succeeds, `0000000001` fails.

## Seller verification

Each seller you name verifies their identity once (BVN and a selfie, on a KetaPay page, no sign-in) before KetaPay pays them; after that any amount goes through. A business selling for itself is never held.

- Until then their milestones' `payout.status` is `awaiting_verification` and `payout.verification_url` is the page to send them to (the same for all their payouts). Opened on a computer, it shows a code to continue on a phone.
- To bring them back to your app afterwards, make the link yourself:

```ts
const link = await ketapay.verificationLinks.create(
  { return_url: 'https://market.example.com/payouts', refresh_url: 'https://market.example.com/payouts/verify' },
  { customerToken: sellerToken },
) // send the seller to link.url; it works for 24 hours, an expired one goes to refresh_url
```

- When they finish, everything held goes to their payout account and you get `payout.sent` or `payout.failed`.
- If you already verify sellers' identity yourself, ask KetaPay to review your process; once approved your sellers skip this step.
- Test mode: tapping Start on the page verifies at once, or `ketapay.testHelpers.customers.verify({ customerToken: sellerToken })`.

## While a deal runs, it's your customers'

Delivering and releasing are the buyer's and seller's decisions, with their customer token or the buyer's release code (`ketapay-customer-tokens`, `ketapay-escrow-lifecycle`). Your platform can't release or refund their deal (`dispute_required`). When one of them raises a dispute, **your platform decides it** under your published policy: release, refund or split, with `disputes.resolve` and an `escrows:manage` key. See `ketapay-disputes-refunds`.
