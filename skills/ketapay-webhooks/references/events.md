# Event types

Each event's payload is in the API reference (https://docs.ketapay.com/api-basics/overview). New types may be added: ignore types you don't handle. `npm test` in this repo fails if the API gains a type that isn't listed here.

| Event | When | Typical handling |
| --- | --- | --- |
| `checkout_session.expired` | A session ran out of time unpaid | Release the reserved stock or cart |
| `escrow.funded` | The buyer paid; the escrow exists | Mark the order paid (idempotently) and store `escrow_id` |
| `milestone.delivered` | The seller marked a milestone delivered | Prompt the buyer to check and release |
| `milestone.changes_requested` | The buyer asked for changes after delivery | Prompt the seller to deliver again |
| `milestone.released` | A milestone was released to the seller | Update progress |
| `escrow.completed` | Every milestone is settled | Close the order |
| `escrow.refunded` | The escrow ended with everything returned to the buyer | Close the order as refunded |
| `dispute.opened` | A dispute started | Freeze fulfilment of that milestone, tell both sides |
| `dispute.evidence_requested` | KetaPay asked someone for evidence | Prompt `awaiting_evidence_from` before `evidence_due_at` |
| `dispute.evidence_submitted` | Evidence came in | Update the dispute view |
| `dispute.resolved` | A dispute ended: `released`, `refunded`, `partially_refunded` or `withdrawn` | Continue or close the order |
| `payout.sent` | A seller's payout reached their bank | Tell the seller |
| `payout.failed` | A payout failed; the money stays in the seller's balance | Ask the seller to check or add a payout account |
| `refund.sent` | A refund reached the buyer | Tell the buyer |
| `refund.failed` | A refund couldn't go back the way it came (not sent during the beta) | Tell the buyer it went to their KetaPay balance |
| `chargeback.opened` | A card chargeback started (not sent during the beta) | Nothing to do; KetaPay contests it |
| `chargeback.closed` | A chargeback ended (not sent during the beta) | Update records |

Events KetaPay or a bank cause (rulings, evidence requests, chargebacks, failed refunds) can't be produced in test mode: send a sample with `webhookEndpoints.test(endpointId, type)`.
