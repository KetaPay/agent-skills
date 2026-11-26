# Every endpoint

Every operation in the public API, with its Node.js call, the scope it needs and whether it also needs the customer's proof (a customer token, or for a release-code escrow the buyer's code). PHP uses the same names (`$ketapay->escrows->milestones->release(...)`). `npm test` in this repo fails if the API gains an operation that isn't listed here.

Base URL `https://api.ketapay.com/v1`. Full reference: https://docs.ketapay.com/api-basics/overview

## Checkout sessions

| Operation | Node.js | Scope | Customer proof |
| --- | --- | --- | --- |
| `createCheckoutSession` | `checkoutSessions.create(params)` | `checkout_sessions:write` | |
| `listCheckoutSessions` | `checkoutSessions.list({ status, external_reference })` | `checkout_sessions:read` | |
| `getCheckoutSession` | `checkoutSessions.retrieve(id)` | `checkout_sessions:read` | |
| `cancelCheckoutSession` | `checkoutSessions.cancel(id)` | `checkout_sessions:write` | |
| `createCheckoutSessionBankTransfer` | `checkoutSessions.bankTransfer(id, { customerToken })` | `checkout_sessions:write` | buyer |
| `retrievePricing` | `pricing.retrieve()` | `checkout_sessions:read` | |

## Customers

| Operation | Node.js | Scope | Customer proof |
| --- | --- | --- | --- |
| `createCustomerSession` | `customerSessions.create({ email })` or `{ phone }` | `customer_sessions:write` | |
| `verifyCustomerSession` | `customerSessions.verify(id, code)` | `customer_sessions:write` | the code |

## Escrows and milestones

| Operation | Node.js | Scope | Customer proof |
| --- | --- | --- | --- |
| `listEscrows` | `escrows.list({ status, external_reference })` | `escrows:read` | |
| `getEscrow` | `escrows.retrieve(id)` | `escrows:read` | |
| `deliverMilestone` | `escrows.milestones.deliver(id, milestoneId, { note, attachments }, { customerToken })` | `escrows:act` | seller |
| `requestMilestoneChanges` | `escrows.milestones.requestChanges(id, milestoneId, { note }, { customerToken })` | `escrows:act` | buyer |
| `releaseMilestone` | `escrows.milestones.release(id, milestoneId, {}, { customerToken })` or `{ release_code }` | `escrows:act` | buyer, or the buyer's release code |
| `getMilestoneReleaseCode` | `escrows.milestones.releaseCode(id, milestoneId, { customerToken })` | `escrows:act` | buyer |
| `flagEscrow` | `escrows.flag(id, { reason })` | `escrows:flag` | |
| `uploadFile` | `files.create({ file, filename, purpose })` | `files:write` | for `delivery` and `dispute_evidence` |

## Refunds and money actions

| Operation | Node.js | Scope | Customer proof |
| --- | --- | --- | --- |
| `refundEscrow` | `escrows.refund(id, { reason })` | `escrows:manage` | |
| `getMoneyAction` | `moneyActions.retrieve(id)` | `escrows:read` | |

## Disputes and chargebacks

| Operation | Node.js | Scope | Customer proof |
| --- | --- | --- | --- |
| `openDispute` | `disputes.create(escrowId, { milestone_id, reason, description }, { customerToken })` | `escrows:act` | buyer or seller |
| `listEscrowDisputes` | `disputes.listForEscrow(escrowId)` | `escrows:read` | |
| `getDispute` | `disputes.retrieve(id)` | `escrows:read` | |
| `concedeDispute` | `disputes.concede(id, { customerToken })` | `escrows:act` | seller |
| `resolveDispute` | `disputes.resolve(id, { outcome, refund_amount, reason })` | `escrows:manage` | platforms, on their customers' deals |
| `withdrawDispute` | `disputes.withdraw(id, { customerToken })` | `escrows:act` | whoever opened it |
| `escalateDispute` | `disputes.escalate(id, { customerToken })` | `escrows:act` | buyer or seller |
| `submitDisputeEvidence` | `disputes.submitEvidence(id, { statement, files }, { customerToken })` | `escrows:act` | buyer or seller |
| `listDisputeEvidence` | `disputes.listEvidence(id, { customerToken })` | `escrows:act` | buyer or seller |
| `listEscrowChargebacks` | `chargebacks.listForEscrow(escrowId)` | `escrows:read` | |
| `getChargeback` | `chargebacks.retrieve(id)` | `escrows:read` | |
| `submitChargebackEvidence` | `chargebacks.submitEvidence(id, { statement }, { customerToken })` | `escrows:act` | seller |

## Payout accounts and seller verification (platforms)

| Operation | Node.js | Scope | Customer proof |
| --- | --- | --- | --- |
| `listBanks` | `banks.list()` | `payout_accounts:read` | |
| `createPayoutAccount` | `payoutAccounts.create({ bank_code, account_number }, { customerToken })` | `payout_accounts:write` | seller |
| `confirmPayoutAccount` | `payoutAccounts.confirm(id, code, { customerToken })` | `payout_accounts:write` | seller, plus the code |
| `listPayoutAccounts` | `payoutAccounts.list({ customerToken })` | `payout_accounts:read` | seller |
| `deletePayoutAccount` | `payoutAccounts.del(id, { customerToken })` | `payout_accounts:write` | seller |
| `createVerificationLink` | `verificationLinks.create({ return_url, refresh_url }, { customerToken })` | `payout_accounts:write` | seller |

## Webhooks and events

| Operation | Node.js | Scope | Customer proof |
| --- | --- | --- | --- |
| `createWebhookEndpoint` | `webhookEndpoints.create({ url, enabled_events })` | `webhook_endpoints:write` | |
| `listWebhookEndpoints` | `webhookEndpoints.list()` | `webhook_endpoints:read` | |
| `getWebhookEndpoint` | `webhookEndpoints.retrieve(id)` | `webhook_endpoints:read` | |
| `updateWebhookEndpoint` | `webhookEndpoints.update(id, { url, enabled_events, status })` | `webhook_endpoints:write` | |
| `deleteWebhookEndpoint` | `webhookEndpoints.del(id)` | `webhook_endpoints:write` | |
| `testWebhookEndpoint` | `webhookEndpoints.test(id, eventType)` | `webhook_endpoints:write` | |
| `rotateWebhookSecret` | `webhookEndpoints.rotateSecret(id)` | `webhook_endpoints:write` | |
| `listEvents` | `events.list()` | `events:read` | |
| `getEvent` | `events.retrieve(id)` | `events:read` | |

## Test helpers

| Operation | Node.js | Scope | Customer proof |
| --- | --- | --- | --- |
| `testPayCheckoutSession` | `testHelpers.checkoutSessions.pay(id)` | `test_helpers:write` | test keys only |
| `testVerifyCustomer` | `testHelpers.customers.verify({ customerToken })` | `test_helpers:write` | seller; test keys only |
