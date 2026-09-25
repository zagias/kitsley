# Project assistant configuration

The main workspace now has persistent project conversations, guided intake, contextual toolbox checks and a bookcase drawing handoff. Guided mode works without an API key. It does not impersonate live AI.

To enable the implemented server-side free-form assistant, set these in the local `.env.local` (never in browser code):

```
OPENAI_API_KEY=your_project_api_key
OPENAI_MODEL=your_responses_api_model_id
KITSLEY_AI_ENABLED=true
KITSLEY_AI_DAILY_LIMIT=30
```

Restart the server after configuration. Select a model available to your OpenAI project. No model or credentials are preselected, and no paid API calls were made during implementation.

The adapter uses the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text), keeps credentials server-side, sets `store: false`, bounds input and output, uses a timeout, and counts requests against a persisted daily preview allowance. The allowance is shared across the single local server and capped at 100; failed provider attempts also consume it. It is a development cost control, not a production billing or entitlement system. Production needs authenticated per-user limits, transactional shared storage, monitoring and payment entitlements before public activation.

AI can answer project questions using the conversation and a matched guide. It does not execute purchases, research live retailer prices or silently alter drawings. Bookcase dimensions continue through the validated geometry engine. Account sync, checkout, retailer APIs and construction validation remain separate unfinished integrations.

The project conversation URLs identify locally saved records. They resume in the same browser and support Back/Forward, including the details panel. They are not public share links. Existing guides and saved designs remain available.

Validation: unit tests cover repair branching, valid/invalid geometry input, urgent routing, offline API behavior, mocked Responses extraction and budget enforcement. Live provider access requires configuration and a separate real-service smoke test.
