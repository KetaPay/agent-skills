# KetaPay agent skills

Know-how for AI coding assistants building on [KetaPay](https://ketapay.com). Each skill is a folder with a `SKILL.md` in the open [Agent Skills](https://agentskills.io) format, read by Claude Code, Cursor, Codex, VS Code, Gemini CLI and others. The assistant sees one line per skill and loads the rest when a task needs it.

> Draft. Not published yet.

## Install

```sh
npx skills add KetaPay/agent-skills
```

Or copy the folders you want from `skills/` into your project's skills folder (for Claude Code, `.claude/skills/`).

## Skills

| Skill | Use it for |
| --- | --- |
| [ketapay-setup](skills/ketapay-setup/SKILL.md) | Merchant or platform, keys and scopes, SDKs, first call, every endpoint |
| [ketapay-checkout](skills/ketapay-checkout/SKILL.md) | Taking a payment (redirect, on your page, bank transfer) and confirming it |
| [ketapay-customer-tokens](skills/ketapay-customer-tokens/SKILL.md) | Letting buyers and sellers act from your UI with a one-time code |
| [ketapay-escrow-lifecycle](skills/ketapay-escrow-lifecycle/SKILL.md) | Milestones, delivery, changes, release, release codes, files, flags |
| [ketapay-disputes-refunds](skills/ketapay-disputes-refunds/SKILL.md) | Disputes, evidence, refunds, money actions, chargebacks |
| [ketapay-platforms-payouts](skills/ketapay-platforms-payouts/SKILL.md) | Marketplaces: approval, sellers, commission, payout accounts, payouts |
| [ketapay-webhooks](skills/ketapay-webhooks/SKILL.md) | Verifying, deduplicating and testing events; every event type |
| [ketapay-testing](skills/ketapay-testing/SKILL.md) | Test keys, test values, paying from code, acting as both sides |
| [ketapay-money-safety](skills/ketapay-money-safety/SKILL.md) | Kobo, idempotency, keys, fees, every error code, going live |

Each `SKILL.md` stays short; detail an assistant only sometimes needs (every endpoint, error code, event type, session field, SDK set-up) is in the skill's `references/` folder and loaded on demand.

## Skills and the MCP server

The [KetaPay MCP server](https://github.com/KetaPay/ketapay-mcp) lets an assistant **act**: search the docs, create test payment links, read escrows, set up webhooks. These skills tell it **how to build the integration correctly**. Use both: the skills point at MCP tools where one helps.

## Keeping them true

The docs at docs.ketapay.com and the public spec are the source. A skill repeats only the rules an assistant must not get wrong and links to the page for the rest.

- `npm run sync-spec` copies the bundled spec from the documentation repo into `spec/` with a hash.
- `npm test` checks the Agent Skills format (name, description, size, links one level deep), that the spec wasn't edited by hand, and that the references cover **every operation, event type, error code and scope** in the spec. A new API feature fails here until a skill knows about it.
- `npm run test:links` also checks every docs link answers; CI runs it on every PR and weekly.
