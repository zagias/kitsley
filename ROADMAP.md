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

## OpenAI-assisted learning and model independence

Current: approved application knowledge, exact private answer reuse, deterministic geometry, private project evidence and aggregate recurring-topic counts. These are not an independently trained LLM or an automatic training pipeline.

Planned: collect consented/de-identified candidate examples; use OpenAI and primary sources to propose/challenge improvements; retain provenance, applicability and expiry; review safety-critical facts; run held-out scenario and numerical regression tests; publish versioned knowledge/rule changes only after passing; support rollback. No customer conversation becomes public training material by default. Teacher-generated answers are candidates, never their own proof.

Keep dataset and evaluation tooling provider-independent. OpenAI's self-serve fine-tuning availability is restricted to eligible existing customers and new jobs are scheduled to end on January 6, 2027. Do not build the roadmap around assumed access. Check current eligibility and supported alternatives before commissioning any separate fine-tuned model. Official source checked September 26, 2026: https://developers.openai.com/api/docs/deprecations#update-to-openais-self-serve-fine-tuning
