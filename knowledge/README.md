# Controlled knowledge expansion

This is a reference publication pipeline, not model-weight training. The application uses the generated catalog immediately after deployment for library search, contextual guidance and narrowly matched educational answers.

## Where information lives

- `approved.json`: reviewed content, product/material/environment/jurisdiction exclusions, per-fact evidence locators, edition, expiry and content digest. This versioned repository is the durable record.
- `candidates/`: unapproved research results. Nothing here is imported into customer advice.
- `revocations.json`: explicit withdrawals. Revoking an ID does not silently restore an older version.
- `topics.json`: editorial research backlog across all 15 areas. No customer questions, account IDs or private projects are included.
- `../lib/managed-knowledge.mjs`: generated customer-facing catalog. Do not edit it manually.

The older foundation records remain under their original editorial/date gates. The stronger digest/review workflow currently covers the new managed records; it does not retroactively certify the older library.

## Operator workflow

1. `npm run knowledge:plan` lists research topics and managed references due within 30 days.
2. `npm run knowledge:research -- hvac-foundation` uses `OPENAI_API_KEY` and `KNOWLEDGE_RESEARCH_MODEL` (falling back to the configured `OPENAI_MODEL`). Uses Responses web search, the trusted primary-source host list, a four-tool-call cap and a 4,500-output-token cap. It produces 1-3 scoped candidates per call. The host list may require reviewed expansion for a new manufacturer.
3. Inspect each candidate against the actual cited document. Source-list inclusion only proves retrieval provenance, not factual support. Check exact formulation, model, dates, limitations, conflicting statements and applicability. Edit the draft and run `npm run knowledge:validate -- knowledge/candidates/FILE.json`; retained search provenance is checked again. New source URLs require fresh research. Never fabricate provenance; never change already approved revisions.
4. `npm run knowledge:approve -- knowledge/candidates/FILE.json 0 'Reviewer identity' editorial 'Specific review notes'` records review of the exact content. Elevated-risk procedural records require `qualified-trade` review. This is an operator attestation; the organization must verify credentials. A model calling itself qualified is not acceptable.
5. `npm run knowledge:compile`, `npm test`, and `npm run build`. The prebuild check refuses catalog drift. Commit and deploy to publish. Customer sessions cannot invoke approval or change these files.
6. For corrections, create a higher revision; retain old review history. For urgent withdrawal: `npm run knowledge:revoke -- record-id 'Reviewer' 'Reason'`, compile and deploy. To restore an older valid meaning, prepare and review a new higher revision, explicitly remove the withdrawal with documented review, and deploy. Git history provides release rollback.

There is no scheduled worker enabled and no autonomous self-publication. The CLI can run in a controlled job with durable output storage. Do not run it on an ephemeral Heroku filesystem and mistake output there for persistent learning. Recurring execution requires a durable candidate store, a budget and an operator schedule. API failures never publish content. No raw research response or secret is printed.

## What validation establishes

Schema, bounded values, trusted-host URLs, evidence locators for each fact, explicit scope, unresolved-conflict rejection, expiry, immutable digest, revision uniqueness, exact-answer ambiguity and review metadata are checked. The tests exercise rejection paths and actual runtime retrieval. They do not prove physical safety, structural capacity or professional competence. Research can add references; it cannot register a new geometry builder or grant permission for invasive work.

The temperature discrepancy example is a real conflict from the Titebond III page: the application-guideline and limitation sections give different minimums. It deliberately remains quarantined and absent from runtime answers. Dates on documents must not be updated merely because a fetch succeeds.
