# Checkout session fields

Source: https://docs.ketapay.com/payments/accept-payments and the `CreateCheckoutSessionRequest` in the API reference.

| Field | Notes |
| --- | --- |
| `amount` | Price in kobo. The buyer pays this plus KetaPay's buyer fee and VAT. Limits come from the account's pricing (`amount_too_small`, `amount_requires_custom_rate`) |
| `title`, `description` | What is being bought. Shown on checkout and kept as the record of the deal |
| `buyer` | `{ email }` or `{ phone }` (`+234` format), optional `name`. Receipts, codes and links go there |
| `seller` | Platforms only: the customer selling. Leave out when your business is the seller |
| `milestones` | Optional, up to 20: `[{ title, amount, due_date }]`, adding up to `amount` |
| `release` | `{ method: 'buyer_confirms', inspection_hours }` (default) or `{ method: 'release_code' }` for in-person deals |
| `commission` | Platforms: `{ rate_bps, min_amount, max_amount }`; omit for your default, `null` for none |
| `images` | `[{ url }]`, https. KetaPay keeps a copy at creation |
| `attachments` | `[{ url, name }]` or `[{ file }]` from `files.create({ purpose: 'agreement' })` |
| `return_url`, `cancel_url` | Where the buyer goes after paying, or if they leave. https (`http://localhost` with a test key) |
| `expires_at` | 15 minutes to 7 days from now; default 24 hours |
| `external_reference` | Your order id. Search sessions and escrows by it |
| `metadata` | Your own key-value data, copied to the escrow |

## What comes back

`id`, `url` (send the buyer here), `status` (`open`, `complete`, `expired`, `cancelled`), `livemode`, `escrow_id` once paid, and `fees`:

| `fees` field | Meaning |
| --- | --- |
| `buyer_total` | What the buyer is charged: `amount + buyer_fee + buyer_vat`. Show it before they pay |
| `seller_payout` | What the seller receives once all is released: `amount - seller_fee - commission` |
| `buyer_fee`, `buyer_vat`, `seller_fee`, `commission` | The parts, in kobo |

Read figures from `fees`; never work them out yourself.
