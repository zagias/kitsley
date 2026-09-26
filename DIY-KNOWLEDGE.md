# Cross-domain DIY knowledge and specialist coordination

This release extends Kitsley's reference and decision-support engine. It does not train model weights or establish contractor qualifications.

## What runs today

- Fifteen competency areas in `lib/diy-domains.mjs`: cabinetry, cabinet doors, electrical, plumbing, drywall, materials, adhesives, fastening, HVAC, hanging doors, finishing/sanding, wet areas, flooring, maintenance and outdoor work.
- Source-backed records in `lib/diy-knowledge.mjs` and `lib/trade-knowledge.mjs`. Each has scope, required project facts, limitations, source IDs, revision and review dates. Expired, future-dated and missing-source records are excluded from retrieval.
- Exact general educational questions can be answered without an OpenAI request. Personal prescriptions cannot be authorized by a fuzzy match. The public route serves these even while AI is disconnected.
- `lib/specialist-review.mjs` supplies the full competency registry to the existing OpenAI Responses call. It requests a shared lead, participating areas, reasons, findings, dependencies and next area. Keyword routing is only a suggestion: the model may involve any registered area. This is one structured reasoning/research workflow, not separately trained specialist LLMs.
- The server checks domain IDs and source provenance, downgrades unsupported findings, adds omitted dependencies, prevents circular dependencies from completing themselves, and carries unresolved dependencies upstream. Open issues prevent step updates and design application. References do not certify site conditions.
- A concealed-services wall-opening rule is one concrete safeguard in this general engine. Electrical, plumbing and drywall concerns remain linked; a negative detector reading, power-off claim, photograph or self-reported experience cannot clear the work.
- Specialist findings stay in the account's project and are available on the next interaction. They appear in a collapsed details panel. Backups retain findings but require fresh review, never restoring approval authority.
- Private project learning records bounded, known-area question counts. Admin sees aggregated demand and current/expired reference coverage, not private conversations. Research findings remain private; no answer automatically becomes shared advice.
- Equipment identification is task-relevant: ordinary hand tools support type/size records without a make/model; powered tools, detectors, specialist jigs, safety equipment and product-dependent systems retain identifiers. A manual tool described as powered, torque, insulated, laser or calibrated receives the more specific fields. Existing identifiers are preserved.

## Increasing reusable knowledge

1. Use recurring area/topic counts to identify a gap.
2. Retrieve the exact current primary instructions and compare applicable independent evidence. Record product generation, substrate, geography, document edition and conflicting claims.
3. Review the proposed factual record for applicability, missing inputs and failure cases. OpenAI can assist this review; a second model agreement is not independent proof.
4. Add a scoped record and source, review dates, new exact educational intents only where appropriate, and representative plus adversarial regression examples. Bump the foundation version so cached advice cannot silently reuse superseded context.
5. Run the test suite and production build; inspect relevant UI/artifacts before deploying. New geometry needs its own deterministic builder and checks.

The current publication step is a versioned code/content release. There is no autonomous source monitor, automatic expert approval, shared answer promotion or continuous fine-tuning job. Review dates gate reuse but do not schedule background refresh. These remain distinct capabilities to build and evaluate before enabling.

## Coverage limits

Reference coverage is partial across every area. It does not cover every jurisdiction, material, product or building condition. Unknowns use source research, a focused question or a qualified site assessment. Complex electrical, gas, structural and hazardous-material work retains its existing restricted scope. The only registered dimensional builders remain the bounded bookcase variants; knowledge in another area does not create a validated cabinet, deck or enclosure drawing engine.

## Verification

Tests cover cross-domain routing and topic changes, evidence/dependency conflicts, absent receiving roles, cycles, concealed-services holds, dates and provenance, privacy of aggregates, backup restoration, public no-AI answers, equipment identification and the API's structured review path. They test software behavior, not construction certification or an expert's complete competence.
