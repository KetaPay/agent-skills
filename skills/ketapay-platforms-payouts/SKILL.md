---
name: ketapay-platforms-payouts
description: Build a KetaPay marketplace (platform) where your customers sell to each other - getting approved, naming the seller, your commission, and letting sellers add the payout account they are paid to. Use when building a marketplace, freelance or property platform on KetaPay, a seller onboarding or payout-account screen, commission settings, or handling payout.sent and payout.failed.
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
- KetaPay can pause a platform; while paused, its refunds on customers' deals fail with `rulings_paused`.

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

- Each release is paid to the seller's active payout account automatically. With no account yet, or if the transfer fails, the money waits in their KetaPay balance and goes as soon as they confirm one.
- Each milestone's `payout` shows where its money is.
- `payout.sent`: it reached the bank. `payout.failed`: it stays in the seller's balance; prompt them to check or add an account.
- Test mode: account `0000000000` (any bank) succeeds, `0000000001` fails.

## Releases stay with the buyer

Delivering and releasing are the buyer's and seller's decisions, with their customer token or the buyer's release code (`ketapay-customer-tokens`, `ketapay-escrow-lifecycle`). Your platform can't release on its own, and KetaPay decides disputes (platform rulings are coming).
