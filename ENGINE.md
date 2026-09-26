# Kitsley project engine

Kitsley uses a hybrid, capability-based engine. OpenAI interprets requests and can research evidence; application code owns dimensional calculations, artifact generation, state transitions and permission to apply a change. This is not a newly trained model and it does not guarantee construction safety.

## Runtime path

1. **Clarify feasibility** (`feasibility.mjs`): detect missing units, unusual scale and impossible usable space. Ask instead of silently changing the request. A miniature is a different purpose, not an invalid user.
2. **Retrieve precisely** (`internal-answers.mjs`, `diy-knowledge.mjs`): use supported guide answers and scoped general reference answers without AI. Unmatched personal questions proceed to research; semantic similarity does not authorize a construction answer.
3. **Research and challenge** (`advice-research.mjs`): source-aware Responses API calls, product/material/jurisdiction comparison, explicit uncertainty, provider-returned citations. Web content is evidence, not instructions. Token accounting and plan limits remain server-side.
4. **Build an assessment** (`technical-assessment.mjs`): material identity, cutting, damage, strength, joining, tools, finish, environment, safety, dimensions and assembly. Missing topics remain unresolved. An unsourced asserted fact cannot become an established technical decision. The compact UI opens one topic at a time.
5. **Evaluate capabilities** (`project-engine.mjs`): explain, research and propose are separate from a supported design operation. The operation contract forbids arbitrary code, novel joints or unsupported shape parameters. Individual-part requests cannot become whole-design dimensions.
6. **Compile and check**: the registered bookcase compiler computes drawings, parts, materials, tools and steps from one model. Reconstruction and count checks run before a proposal is returned. This checks dimensional consistency, not structural capacity. No load rating is inferred.
7. **Review and apply**: a design proposal is tied to the exact saved context. Changed dimensions, material, notes or progress make it stale. A pending proposal cannot rewrite instructions against the old geometry. The existing revision confirmation and cutting warning apply before changing the project.
8. **Remember with provenance**: source URLs and check dates persist with project messages and permitted step adaptations; backups retain them. Research responses do not silently enter the exact-answer cache. Repeated topic counts can improve discovery, but personal evidence cannot publish a global rule.

## Capability boundaries

- General material/method research and structured planning work across topics.
- The current registered dimensioned builder is the indoor uniform-shelf bookcase. Its bounds and supported materials are enforced in code.
- A foamboard craft, converted dog crate, tapered cabinet or novel joint can be researched and assessed. It cannot yet be presented as a validated illustrated build by this builder.
- A source URL is provenance, not proof that every sentence is correct. Primary-source selection and claim comparison are currently model-assisted; semantic accuracy still requires evaluation and review.
- No autonomous source-monitoring scheduler, training job or global publication process exists in this release.

## Extending the engine

A new design capability needs a canonical model with explicit material/product conditions, required facts, supported operations, formula/constraint tests, a joint and hardware specification, generated artifact consistency checks, safety scope and regression examples. It must declare which checks are mathematical and which need manufacturer data, empirical validation or professional review. Unknown values stay unknown. Do not implement new capabilities as prose claiming drawings were changed.

A future published-knowledge repository must separate private observations, research candidates, reviewed rules and retired versions. Candidate records need provenance, exact applicability, source revision/date, disagreements, reviewer status, tests and rollback history. A material or standard change must invalidate dependent candidates and flag affected projects; it must never silently change an active cut list. Background monitoring can gather evidence automatically, but repeated AI agreement is not independent verification.

## Four customer paths

`project-paths.mjs` separates **Build something**, **Household DIY**, **DIY trade work** and **Big projects**. The home selection is saved with the project; a conservative inferred path is used when no choice is made. Customers can change the area in Project details. Each path has its own discovery questions and sends its workflow, actual task checks and (for larger work) current planning phase to the engine. The phase selector is a planning aid, not inspection approval or a complete construction schedule. Safety checks depend on task content in every area; choosing a different category cannot remove them. The existing prohibition on invasive electrical, gas, structural and hazardous-material procedures remains in the server instructions.

## Safeguards and their limits

`safety-policy.mjs` applies task checks independently of the chosen customer area or payment status. Known requests for hazardous procedures return a fixed safe-scope response before an OpenAI call. Relevant hands-on requests pause for missing equipment/assembly, condition and (where applicable) location details. Initial planning advice does not require a long form. The UI keeps the scope check compact, with reasons in a disclosure.

A versioned, context-bound record captures the facts the customer supplied and the scope they reviewed. Changes to the task, design, phase or facts invalidate it; restored backups require a new review. This is not a waiver, professional inspection, verified identity/qualification, legal authorization or an immutable audit log. It cannot unlock hazardous instructions. Relevant AI responses remain planning/research guidance; automated guide/geometry changes are suppressed. Additional output checks reject several known hazardous imperative patterns, but keyword checks are not an exhaustive semantic safety verifier.

Source anchors checked 2026-09-26: [Ontario ESA notifications and inspections](https://esasafe.com/compliance/what-you-need-to-know/), [Technical Safety BC homeowner electrical permits](https://www.technicalsafetybc.ca/apply-for/permits/homeowner-permits/homeowner-electrical-permits), [CPSC GFCI fact sheet](https://www.cpsc.gov/safety-education/safety-guides/electronics-and-electrical-home/gfci-fact-sheet). These establish the need for jurisdiction- and task-specific checks; no single province's rules are applied to all users. The sources must be rechecked for a user's actual work.

Before a wider commercial launch: obtain jurisdiction-appropriate legal review of claims/terms, qualified trade review of procedure libraries, adversarial safety evaluations, incident reporting/escalation, and an append-only server audit trail. Those organizational controls and liability coverage are not delivered by this code. No guarantee of user safety, code compliance or near-100% correctness is made.
