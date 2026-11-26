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
| [ketapay-checkout](skills/ketapay-checkout/SKILL.md) | Taking a payment into escrow and confirming it before fulfilling the order |
| [ketapay-webhooks](skills/ketapay-webhooks/SKILL.md) | Verifying, deduplicating and testing webhook events |
| [ketapay-escrow-lifecycle](skills/ketapay-escrow-lifecycle/SKILL.md) | Milestones, delivery, release, release codes, disputes and flags |
| [ketapay-money-safety](skills/ketapay-money-safety/SKILL.md) | Kobo, idempotency, keys, fees, errors and going live |

## Skills and the MCP server

The [KetaPay MCP server](https://github.com/KetaPay/ketapay-mcp) lets an assistant **act**: search the docs, create test payment links, read escrows, set up webhooks. These skills tell it **how to build the integration correctly**. Use both: the skills point at MCP tools where one helps.

## Keeping them true

The docs at docs.ketapay.com are the source. A skill repeats only the rules an assistant must not get wrong and links to the page for the rest. When a docs page changes, the skill that cites it changes in the same release; `npm test` checks every skill's frontmatter and that each docs link answers.
