---
name: ketapay-setup
description: Start a KetaPay integration - choose merchant or platform, get test and live keys with the right scopes, install the server or browser SDK, and make a first call. Use when someone first adds KetaPay to a project, picks an SDK, sets up keys or environment variables, or asks which KetaPay features or endpoints exist.
license: MIT
metadata:
  version: "0.1.0"
---

# Set up KetaPay

KetaPay holds a buyer's money in escrow and releases it to the seller when the deal is done. Your server talks to the API at `https://api.ketapay.com/v1` with a secret key; browser code never holds a key.

Docs: https://docs.ketapay.com/quickstart and https://docs.ketapay.com/merchants-and-platforms

## 1. Merchant or platform?

Ask the person if it isn't clear. It decides who the seller is.

| | Merchant | Platform |
| --- | --- | --- |
| Who | Sells its own goods or services | A marketplace where its customers buy from each other |
| `seller` on a checkout session | Leave it out: the business is the seller | Name the seller on every session |
| Paid out to | The business's KetaPay balance | The seller's own payout account |
| Approval | None | KetaPay approves it before live use |

If the money ends up with the business, it's a merchant. If it ends up with someone who uses the site, it's a platform. Doing both: apply as a platform and leave `seller` out on the business's own sales. Platform work: see the `ketapay-platforms-payouts` skill.

## 2. Keys

- **Test:** in the business dashboard (https://business.ketapay.com), switch to **Test** and create a key in **Settings > API keys**. It starts with `sk_test_`. No account yet: the public docs key on https://docs.ketapay.com/playground works for trying things.
- **Live:** `sk_live_` keys are issued once the business is verified in **Compliance**. Nothing else in the code changes.
- Same base URL for both; the key decides the environment and every object carries `livemode`.
- Give each system its own key with only the scopes it needs. See [references/scopes.md](references/scopes.md).
- Keys live in the server's secret manager or environment (`KETAPAY_SECRET_KEY`), never in a browser, app, repository or AI prompt.

## 3. Install

| Where | Package |
| --- | --- |
| Node.js 18+, Deno, Bun, edge | `npm install @ketapay/node@next` |
| PHP 8.1+ | `composer require ketapay/ketapay-php:@beta` |
| Laravel 12/13 | `composer require ketapay/ketapay-laravel:@beta` |
| Browser checkout | `npm install @ketapay/checkout@next` or the script tag |
| React 18+ | `npm install @ketapay/react@next` |
| WooCommerce | The KetaPay escrow plugin; paste an `sk_test_` key in its settings |

Set-up code for each: [references/sdks.md](references/sdks.md). The SDKs are in beta, so install the tags shown.

## 4. First call

```ts
import KetaPay from '@ketapay/node'

const ketapay = new KetaPay(process.env.KETAPAY_SECRET_KEY!)
const session = await ketapay.checkoutSessions.create({
  amount: 45_000_000, // kobo: ₦450,000
  title: 'iPhone 15 Pro Max 256GB',
  description: 'Used, 91% battery, no scratches.',
  buyer: { email: 'ada@example.com' },
  external_reference: 'order_7781',
})
// send the buyer to session.url
```

Then follow `ketapay-checkout` (take and confirm the payment) and `ketapay-webhooks` (hear about every change).

## What the API covers

Every operation, its SDK call, its scope and whether it needs the customer's proof: [references/endpoints.md](references/endpoints.md). Which skill covers what:

| Task | Skill |
| --- | --- |
| Take a payment, confirm it | `ketapay-checkout` |
| Let buyers and sellers act from your UI | `ketapay-customer-tokens` |
| Delivery, release, milestones, release codes, files | `ketapay-escrow-lifecycle` |
| Disputes, refunds, chargebacks | `ketapay-disputes-refunds` |
| Marketplaces, seller payout accounts, commission | `ketapay-platforms-payouts` |
| Webhooks and events | `ketapay-webhooks` |
| Test mode, test values, test helpers | `ketapay-testing` |
| Rules for money and keys, errors, going live | `ketapay-money-safety` |

If the KetaPay MCP server is connected, `search_docs` answers anything these skills leave out.
