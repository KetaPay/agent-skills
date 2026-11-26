# Error codes

Every error has `{ error: { type, code, message, param, request_id } }`. Branch on `code`, never on `message`; `param` names the field in dot notation. Log `request_id` for support. New codes may be added: handle unknown ones by `type`. `npm test` in this repo fails if the API documents a code that isn't listed here. Source: https://docs.ketapay.com/api-basics/errors

## Types

| Type | HTTP | Meaning | Retry? |
| --- | --- | --- | --- |
| `invalid_request_error` | 400, 404, 409, 422 | Can't be done as sent | No: fix it, new idempotency key |
| `authentication_error` | 401 | Missing, invalid or expired key or customer token | No |
| `permission_error` | 403 | Key lacks a scope, or the customer isn't the right party | No |
| `idempotency_error` | 409 | `Idempotency-Key` reused with a different body | No |
| `rate_limit_error` | 429 | Too many requests (100 per 10 seconds per key) | Yes, after `X-RateLimit-Reset`, same key |
| `api_error` | 5xx | Failed on KetaPay's side | Yes, same key |

## Codes

| Code | What to do |
| --- | --- |
| `parameter_missing`, `parameter_invalid` | Fix the field named in `param` |
| `contact_required` | Give the buyer or seller an email or a phone |
| `party_identity_conflict` | That email and phone belong to two different KetaPay accounts: send just one |
| `parties_must_differ` | The buyer and seller must be different people |
| `milestones_total_mismatch` | Make the milestones add up to `amount` |
| `commission_exceeds_contract` | Lower `commission.rate_bps` to your agreed maximum |
| `commission_not_allowed` | Commission is for sales between your customers: leave it out when you are the seller |
| `commission_below_fee` | Your platform pays the KetaPay fee from its commission and this commission is less than the fee and VAT: raise it |
| `amount_too_small` | Below the smallest escrow your pricing allows |
| `amount_requires_custom_rate` | Above your plan's maximum: contact KetaPay sales first |
| `release_settings_invalid` | Fix `release` (`method`, `inspection_hours`) |
| `verification_required` | The buyer must verify further for this amount: send them to the session's `url` |
| `checkout_session_not_open` | The session was paid, expired or cancelled: fetch it |
| `payment_method_not_allowed` | Turn bank transfer on in your checkout settings, or take the card |
| `transfer_not_available` | Live bank transfers are not open yet: take the card |
| `escrow_already_flagged` | You flagged this escrow already |
| `escrow_state_invalid` | The escrow's status doesn't allow this: fetch it |
| `milestone_not_current`, `milestone_not_delivered` | Act on milestones in order |
| `inspection_not_over` | The buyer's inspection period is running: wait for `inspection_ends_at` |
| `dispute_open` | The milestone is frozen by a dispute: show it, don't retry |
| `dispute_not_open` | The dispute has ended |
| `escrow_under_review` | KetaPay is reviewing this escrow or deciding this dispute: wait for the event |
| `chargeback_not_open` | Evidence closed: the chargeback is with the bank or past `respond_by` |
| `release_code_invalid` | Wrong release code: let the seller try again |
| `release_code_locked` | 5 wrong codes: entry is locked for 1 hour and the buyer was alerted |
| `code_invalid`, `code_expired`, `too_many_attempts` | One-time code problems: let them request a new code |
| `customer_token_required`, `customer_token_expired` | Get a new customer token |
| `customer_not_allowed` | This customer isn't the party allowed to do this |
| `bank_account_not_found` | The bank couldn't find that account number |
| `file_too_large`, `file_type_not_allowed` | JPEG, PNG, HEIC, WebP, PDF or MP4, up to 25 MB |
| `file_not_usable` | The file can't be used here (wrong purpose, another customer's, or a URL KetaPay couldn't fetch over https) |
| `url_not_https` | URLs must be https (`http://localhost` works only with a test key) |
| `resource_not_found` | No such object for this key and mode: check test vs live |
| `api_key_invalid`, `api_key_expired` | Use a current key from the dashboard |
| `missing_scope` | Use a key with the scope the endpoint names |
| `live_mode_not_enabled` | Live opens once KetaPay verifies the business: use the test key until then |
| `platform_not_approved` | Naming a seller needs platform approval (test mode can be switched first) |
| `dispute_required` | A platform can't refund a deal between its customers; it decides one only when a dispute is raised |
| `not_the_decider` | KetaPay decides disputes on your own sales and on deals your team is part of; a platform decides only its customers' deals |
| `rulings_paused` | KetaPay paused this platform's rulings and decides its open disputes |
| `daily_limit_reached` | This would pass the rolling 24-hour limit |
| `action_already_scheduled` | A refund or release on this escrow is already running: check the money action |
| `idempotency_key_missing` | Add an `Idempotency-Key` to the `POST` |
| `idempotency_key_reused` | Same key, different body: use a new key for a new request |
| `rate_limited` | Wait until `X-RateLimit-Reset`, retry with the same key |
| `test_mode_only` | Test helpers only work with `sk_test_` keys |
| `internal_error` | KetaPay's side: retry with the same key, quote `request_id` if it persists |
