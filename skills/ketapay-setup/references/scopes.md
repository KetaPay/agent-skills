# Key scopes

Each endpoint names the scope it needs (`x-required-scope` in the API reference). A key without it gets `403 missing_scope`. Source: https://docs.ketapay.com/api-basics/authentication

| Scope | Lets the key |
| --- | --- |
| `checkout_sessions:read` | Read checkout sessions and pricing |
| `checkout_sessions:write` | Create and cancel checkout sessions, get bank-transfer details |
| `customer_sessions:write` | Send one-time codes to your customers and verify them |
| `escrows:read` | Read escrows, disputes, chargebacks and money actions |
| `escrows:act` | Act for a customer, with their customer token (deliver, release, disputes, evidence) |
| `escrows:flag` | Flag an escrow for KetaPay to review |
| `escrows:manage` | Refund your own sales, and on a platform decide your customers' disputes, with the key alone. Never added to an existing key: choose it when you create the key, and only for the system that truly refunds |
| `files:write` | Upload files |
| `payout_accounts:read` | List banks and a seller's payout accounts |
| `payout_accounts:write` | Add, confirm and remove payout accounts, and create seller verification links (with the seller's token) |
| `webhook_endpoints:read` | Read webhook endpoints |
| `webhook_endpoints:write` | Create, change, delete, test endpoints and rotate secrets |
| `events:read` | Read events |
| `test_helpers:write` | Test-mode helpers |

## Suggested keys

| System | Scopes |
| --- | --- |
| Web checkout server | `checkout_sessions:read`, `checkout_sessions:write`, `customer_sessions:write`, `escrows:read`, `escrows:act`, `files:write` |
| Webhook worker | `escrows:read`, `events:read` |
| Seller payouts (platforms) | `customer_sessions:write`, `payout_accounts:read`, `payout_accounts:write` |
| Back-office refunds and rulings | `escrows:read`, `escrows:manage` (its own key, kept apart) |
| CI tests | the above plus `test_helpers:write`, test key only |
