# Kitsley development roadmap

This file records planned work, not released capabilities. See [ENGINE.md](ENGINE.md) for the current engine and [QA-ENGINE.md](QA-ENGINE.md) for release verification.

## Future Projects Agent — accepted for further development, 2026-09-26

A persistent planning companion that users can task with researching and comparing options for upcoming projects, then continue through WhatsApp, SMS, email or the application. It uses Kitsley's applicable knowledge first and OpenAI plus source research when needed. Findings, decisions, designs, materials and tools belong to the user's project and evolve together as the user supplies new information.

The full requirements, data model, learning controls, delivery stages and acceptance scenarios are in [FUTURE-PROJECTS-AGENT.md](FUTURE-PROJECTS-AGENT.md).

| Stage | Deliverable | Status |
| --- | --- | --- |
| FPA-1 | In-app future-project brief, research tasks, evidence and comparison cards, saved decisions | Planned |
| FPA-2 | Versioned facts and dependency tracking; changes produce consistent project and artifact revisions | Planned; reuse current supported compiler, extend capabilities separately |
| FPA-3 | Verified channel linking, shared conversation and delivery workflow for email, SMS and WhatsApp | Planned; email/SMS provider setup remains paused until resumed |
| FPA-4 | Evidence-refresh jobs, reviewed shared-learning candidates, evaluation and rollback | Planned |

Apply this capability across Build something, Household DIY, DIY trade work and Big projects. Channel support must not bypass account permissions, plan limits, task safeguards or supported-design boundaries. No messaging provider, background scheduler or autonomous training is enabled by adding this roadmap.
