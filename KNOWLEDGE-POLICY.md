# Kitsley knowledge and reuse policy

Apply this policy across the application, not only to the bookcase.

1. Use deterministic setup, calculations and current stored guide instructions first.
2. Ask for missing substrate, product, location or dimensions; do not infer them from a similar question.
3. Reuse personalized answers only within their original project and exact canonical context. Context includes guide/content version, material/core, dimensions, finish, active step, tool inventory, project notes, prior constraints and conversation. A change invalidates reuse. No embedding or fuzzy similarity may authorize construction-answer reuse.
4. Use OpenAI when no precise internal answer exists; enforce existing server-side entitlement and metering for these calls.
5. Persist useful AI adaptations on affected project steps. They are personal guidance, never automatically trusted global construction knowledge.
6. Record bounded topic counts with each private project. Aggregate those counts for guide improvement without exposing raw questions, project details or answers from other accounts.
7. Improve the versioned source guide to share a correction with everyone. Changing source content must bump its version and add regression examples; stale personalized answers must no longer match.
8. Automatic adaptation may use existing reviewed instructions and calculated values. Novel construction, fastener, load or safety claims need source checking and review before global publication.

Current implementation: exact project-answer reuse; conservative guide intents for all stored manuals; bookcase-specific calculated answers; account-persisted topic counts; admin summary across up to 500 workspaces. This is retrieval and application logic, not a newly trained model. Anonymous usage is local until signed in; no cross-user personalized answer sharing or autonomous publication of novel building methods.

Automatic shared learning: approved question templates are ranked by recurring topic after at least three projects ask about that topic. Their answers are generated from each recipient’s current guide and specifications, never copied from another person’s answer. Rankings refresh every five minutes; no private text or counts are returned by the public endpoint. This changes discovery, not construction facts.

## Foundation repository (2026-09-26)

`lib/diy-knowledge.mjs` adds 39 scoped reference entries across eleven categories: materials, screws/joints, adhesives, blades/bits, sanding, preparation, paints/primers, stains/topcoats, repairs, equipment and hardware/loads. Each has primary-source links, required project facts, limits, revision and review dates. These are source-backed selection references, not professional certification or a complete DIY encyclopedia.

Search ranking supplies up to five background entries to the server-side assistant. Ranking never authorizes a construction answer. Only an explicit allowlist of general educational questions receives a deterministic no-AI answer. Personal screw/bit/load/sprayer prescriptions still need their actual product and project specifications. The existing guide remains authoritative within its supported scope; conflicts must be surfaced, not blended. Expired entries are excluded from runtime lookup and answers until reviewed.

References used as AI context are labeled as references provided to the assistant, not sources independently proving the generated answer. Published entries are source-controlled; user questions and generated answers cannot mutate them. Foundation version participates in private-answer cache invalidation. No payment allowance is spent on a direct foundation answer, including when OpenAI is unavailable.

Expansion requires primary evidence, explicit applicability, tests for near-miss inputs, and review before publication. High-risk or novel structures, pet containment, load ratings and unknown materials must not inherit approval from a nearby entry. The broader design/geometry engine still needs supported operations and end-to-end artifact checks; this repository does not supply arbitrary validated designs.

## Shared evidence checks (2026-09-26)

`lib/advice-research.mjs` defines one policy for every assistant guide and topic. Deterministic guide and foundation answers remain the first path. Every AI call, including initial discovery advice, requests a web source check. A response can claim source support only with a completed search and actual retrieved citations. Unfamiliar projects require a structured assessment. Unresolved assessments cannot offer a proceed-anyway choice or present unsourced method recommendations as an approved approach. Instructions require primary evidence, independent comparison where available, exact product/material/environment/jurisdiction applicability, explicit disagreements and one decisive clarification when facts are missing. Private identifying details must not be included in search queries.

Source links and the check date stay with the project message and any permitted step adaptation. The UI displays clickable citations and source details. URLs must occur in provider-returned search sources or citation annotations; invented URLs cannot become cited evidence. An unresolved, conflicting or limited result cannot write step adaptations. A failed required source check cannot fall back to confident unsourced instructions. This is source-informed AI assistance, not a claim that every generated assertion has been mechanically verified. The configured OpenAI model remains unchanged.

Research uses the existing per-answer entitlement and token accounting. Web-search service costs are additional provider costs inside that request; there is no extra customer allowance debit. Live research answers do not enter the exact-answer cache, so changing technical information is not silently reused. Their history remains readable. The knowledge version is bumped to invalidate earlier private answer caches.

No AI response or web result automatically edits a published guide, geometry, reference record or another account. Future background monitoring must create reviewable candidates with old/new evidence, applicability, conflicts, regression results and rollback history. Source changes must be evaluated before publication; projects already underway retain their revision and receive a relevant change notice. A second OpenAI opinion is useful criticism, never independent empirical validation. Autonomous source monitoring and that publication workflow remain future work.

The project engine now also keeps a structured technical assessment with explicit gaps across material identity, cutting damage, strength, joining and other relevant constraints. Uncited assertions cannot become established decisions. The registered design compiler checks dimensional and part consistency before returning a context-bound review proposal. A small-width or missing-unit request is clarified without spending an AI reply. Neither a planning assessment nor a geometrically consistent artifact establishes a safe load or professional construction approval. See `ENGINE.md` for the executable capability boundaries and extension requirements.
