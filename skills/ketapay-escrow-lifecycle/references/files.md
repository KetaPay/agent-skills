# Files

Upload once with `POST /files`, then refer to the file by id. JPEG, PNG, HEIC, WebP, PDF and MP4, up to 25 MB each (`file_too_large`, `file_type_not_allowed`). Unused files are deleted after 24 hours. Source: https://docs.ketapay.com/escrow/files

| `purpose` | Proof needed | Used in |
| --- | --- | --- |
| `agreement` | Your key | Checkout session `attachments: [{ file }]` |
| `delivery` | Your key and the seller's customer token | Milestone delivery `attachments: [{ file }]` |
| `dispute_evidence` | Your key and the buyer's or seller's token | Dispute evidence `files: [id]` |

A file can only be used by the customer who uploaded it, and only for its purpose (`file_not_usable` otherwise).

```ts
const file = await ketapay.files.create(
  { file: await readFile('./proof-of-delivery.pdf'), filename: 'proof-of-delivery.pdf', purpose: 'delivery' },
  { customerToken: sellerToken },
)
await ketapay.escrows.milestones.deliver(escrowId, milestoneId, { note: 'Signed for by A. Obi', attachments: [{ file: file.id }] }, { customerToken: sellerToken })
```

Checkout sessions also take files by https URL (`attachments: [{ url, name }]`, `images: [{ url }]`): KetaPay keeps a copy at creation, so the record of the deal can't change later.
