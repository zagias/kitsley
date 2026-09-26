# Future Projects Agent

Status: accepted product direction for further development, 2026-09-26. This is a specification; the agent, channel adapters and background jobs described here are not implemented.

## Outcome

A user can say, “Research a cabinet for this alcove; compare materials and costs, use the tools I own, and help me decide before I start.” Kitsley develops a persistent project brief, researches missing facts, compares suitable options, and brings back a concise recommendation with evidence and open decisions. The user can continue in the app, WhatsApp, SMS or email without starting over. Later measurements, photos, product choices, constraints and corrections update the same project.

The companion uses Kitsley's accumulated, applicable knowledge and calculations first. OpenAI assists with interpretation, research, comparison and challenging uncertain conclusions. Repeated use should increase coverage and reduce unnecessary calls while maintaining measured quality. Neither repetition nor model agreement establishes accuracy. Independent model training is a separate possible development track, not an automatic effect of saving chats.

## Customer workflow

1. **Create an upcoming project.** Capture purpose, desired outcome, timeline, budget/currency, location only when relevant, measurements with units, conditions, experience, owned tools and existing materials. Keep unknowns visible and ask one consequential question at a time.
2. **Give the agent a task.** Examples: compare sheet materials, investigate a fitting problem, find model-specific instructions, compare compatible suppliers, prepare design options, or revisit a previous decision. Record the requested deliverable, scope, research budget, deadline if supplied and desired notification channel. Monitoring requires an explicit cadence and stopping condition.
3. **Research and compare.** Retrieve applicable Kitsley knowledge, identify gaps, obtain primary evidence and compare alternatives against the actual brief. Show tradeoffs, evidence dates, unresolved details and the next useful choice. A product comparison must separate suitability, total cost, quantity, delivery and stock certainty.
4. **Save progress continuously.** Store incoming observations, research and proposed decisions immediately with provenance. Confirm ambiguous interpretations. Accepted decisions update their project sections; a suggestion never becomes “owned,” “purchased,” “measured,” or “approved” merely because it was mentioned.
5. **Review the design.** Registered builders generate dimensioned pictures, parts, tools, materials, steps and branded exports from one canonical model. Unsupported structures remain a researched concept with explicit gaps, not a fabricated ready-to-build guide.
6. **Adapt as information changes.** Show a compact “What changed / What it affects / Next action” card. Re-evaluate affected decisions and present a revision for approval when instructions, quantities or geometry change. Preserve the prior accepted design, identify obsolete exports and warn about already-cut or assembled work.
7. **Move into the build.** “Start this project” promotes the upcoming project to active work using the same project ID and history. Research can continue during the build. A deferred project can be resumed after time-sensitive evidence is rechecked.

## One conversation across channels

| Surface | Role |
| --- | --- |
| Application | Full brief, agent tasks, comparison cards, photos, decisions, drawings, change previews, history and exports |
| WhatsApp | Short two-way updates, permitted attachments, clarification and links to the full project/review |
| SMS | Concise questions and updates with a secure route back to the project; complex details stay in the app |
| Email | Longer summaries, evidence and project links, with replies routed back to the relevant task |

Every interaction resolves to an authenticated account, verified channel identity and explicit project/task context. If several projects fit, ask which one. A display name, email From header, forwarded message or phone number alone does not authorize access. Link channels through an authenticated verification flow; support unlinking, revocation and changed numbers. Validate provider events and reply correlation without trusting quoted email history as new instructions.

Keep channel adapters separate from the engine. Use provider message IDs for deduplication, handle delayed/out-of-order events, and preserve sent/received timestamps. One message produces at most one fact update, usage debit and outgoing reply, including after retries. Failed delivery appears in the app; do not silently switch to another channel. The user controls channel consent, quiet hours, notification detail, pause/resume, reminders and opt-out. Third-party supplier contact, purchases and bookings require a separately authorized action.

Send brief notifications for a completed task, a necessary question or a material change. Avoid repeated “still researching” messages. Reveal only the details appropriate to the verified destination; private photos and full project records remain behind account access. Review current provider rules and regional communication requirements when implementing each channel.

## Durable project information

The current account workspace is stored in Supabase `public.account_workspaces` as versioned, private entities. The future service should introduce transactional, account-scoped records for agent activity and preserve compatibility with existing conversations, saved projects, toolbox and stock records. The following are proposed logical entities, not existing tables:

| Entity | Required information and destination |
| --- | --- |
| Project brief | Purpose, four-area path, constraints, budget, timeline, units, status and confirmed facts; shown in Project details |
| Agent task | Scope, requested output, project ID, base revision, status, budgets, deadlines, dependencies, checkpoints and cancellation |
| Interaction | Channel, verified sender, provider/event ID, task/project links, original content reference, timestamps and delivery state |
| Fact or observation | Value, unit, subject/part/product identity, origin, reported versus verified status, validity date, superseded value and supporting evidence |
| Decision or comparison | Options, constraints, tradeoffs, rejected alternatives, rationale, unresolved questions, evidence and user acceptance |
| Research evidence | Source URL, publisher, exact product/model/version, relevant claim, checked date, applicability, disagreements, expiry and retrieval status |
| Design revision | Canonical inputs, supported builder/version, validation results, dependency fingerprint, before/after changes, approval and prior revision |
| Materials | Specification, quantity, planned/selected/owned/purchased status, compatibility and quotes; shown in project Materials. Existing stock stays distinct from planned purchases |
| Tools and equipment | Make/model/variant, capabilities, owned/borrow/rent/buy status and relevant manuals; linked to My toolbox only when ownership is confirmed |
| Guide and artifacts | Step IDs, drawings, cut lists, quantities, exports, current revision and obsolete status; shown in the project guide and downloads |
| Learning candidate | Generalized question, evidence, applicability, conflicts, tests, reviewer/publication state and rollback version; separated from private customer records |

Persist large attachments in private object storage with account/project access checks, retention controls and expiring access links. Do not place raw photos or unbounded conversation history inside the existing workspace JSON. Define migrations, backup/export, deletion, conflict handling and recovery before adding production writes. Background workers must use narrowly scoped access and validate ownership on every job.

## Engine and change handling

Use a durable queue and worker, not an open chat connection, for background research. Task states: draft, queued, researching, needs-user, ready-for-review, completed, paused, cancelled and failed. Waiting for a reply releases the worker. Jobs resume from checkpoints with bounded retries, timeouts and recorded cost. They stop when cancelled, out of allowance or unable to substantiate the requested output. Completion means the requested deliverable exists, not merely that a model returned text.

Each run binds to the latest accepted project revision plus explicitly pending observations. The engine records dependencies from source/fact to decision, design part, quantity, instruction and export. A changed dimension, equipment model, material core, environment, budget or source version invalidates affected conclusions and cached answers. Do not re-run unrelated work or reuse a nearby project's answer.

Changes received while a task is running make its proposal stale. Rebase and recompute against the new facts before offering it. Conflicting channel updates remain visible and need resolution; last-message-wins must not silently replace dimensions or material specifications. Reverting restores an earlier proposal as a new revision and rechecks it against current facts and evidence. It cannot erase the fact that material has already been cut or a safety-relevant condition has changed.

Apply accepted changes atomically across the project. Preserve a versioned event trail for inputs, retrieved evidence, calculations, model/version, decisions, approvals and resulting artifacts. Record concise decision rationale, not hidden model reasoning. Mathematical checks establish dimensional consistency; product compatibility, physical capacity and legal compliance require their own applicable evidence or qualified review.

## Knowledge growth and answer quality

Follow [KNOWLEDGE-POLICY.md](KNOWLEDGE-POLICY.md) and [ENGINE.md](ENGINE.md). The agent and engine share governed knowledge rather than keeping separate, contradictory memories.

- **Private project memory:** exact context, corrections, preferences, tools, accepted decisions and reported outcomes. Distinguish observations from verified specifications. Users can inspect and correct it.
- **Reusable Kitsley knowledge:** scoped, versioned rules, calculators, validated design capabilities and reviewed guide improvements. Retrieval requires the applicable material/core, product/version, environment, units, jurisdiction where relevant, and source freshness.
- **Research candidates:** automate discovery, comparison, gap detection and regression-case drafting. New evidence can challenge an old rule. Publication requires the appropriate review and passing evaluations; model output cannot promote itself to trusted knowledge.
- **Future model development:** only consider training with suitable rights/consent, curated and separated evaluation data, measurable improvement, model/version tracking and rollback. Retrieval and deterministic logic remain necessary even if a model is trained.

Unknown facts trigger a precise question or research. Conflicting sources trigger a visible unresolved decision. A second OpenAI check can challenge an answer, but must not count as independent evidence. Check claims against exact source applicability; cite a manual for the matching model and variant, not merely the brand. Photos can suggest what to inspect but cannot establish hidden conditions or exact dimensions without a verified reference and confirmation.

Repeated questions identify missing guide content. User outcome reports identify candidates for investigation; they do not establish a safe general method. De-identify any shared signals and exclude private raw questions, photos and account details from cross-user reuse. Source documents, emails and user submissions are untrusted data and cannot change agent permissions or publication rules. Reject attempts to poison the knowledge base.

Source-refresh jobs create reviewable old/new comparisons. Retired rules stop serving new recommendations; affected active projects receive a focused notice and retain their saved revision until a reviewed change is applied. Keep alerts and safeguards relevant to the current action. Urgent conditions take precedence over planning or subscription prompts.

## Commercial and operational boundaries

Use the existing server-side account entitlements for every channel. Local knowledge answers do not spend an AI allowance. Define explicit research-job allowances and cost budgets before launch; do not reinterpret today's per-reply allowance as unlimited background work. Show what a task will consume, meter provider/tool activity once, bound recurring monitoring, and handle failure without duplicate charges. No real purchase or subscription change occurs through an unconfirmed conversational inference.

Track task completion, source applicability errors, correction and abstention rates, geometry/artifact mismatches, private-data leakage, duplicate events, delivery failure, latency and cost. Measure safe internal resolution and fewer provider calls only alongside maintained answer quality. Launch gates require no known critical failure in the agreed regression suite; passing tests must not be presented as a universal accuracy guarantee.

Email and phone verification/provider setup was paused by the user. SendGrid and Twilio were named as existing providers, but readiness and permissions must be checked when that work resumes. WhatsApp onboarding is separate future setup. This specification activates no credentials, subscriptions, outbound messages or recurring jobs.

## Delivery stages and acceptance scenarios

1. **FPA-1 — In-app foundation:** upcoming-project status, persistent task queue, scoped research, comparison cards, evidence, project memory and account ownership. Prove useful planning before adding channels.
2. **FPA-2 — Change propagation:** dependency tracking, stale-proposal rejection, consistent revisions/exports, confirmed materials/tool updates and resume/revert. Reuse registered builders; additional validated builders are separate deliverables.
3. **FPA-3 — Channel adapters:** verified linking, consent, inbound/outbound routing, delivery receipts, idempotency, opt-out and recovery; enable each provider only after setup and tests.
4. **FPA-4 — Shared learning:** private-to-candidate separation, evidence refresh, review/publish/retire workflow, evaluated guide updates and rollback. Train a model only as a separately justified later milestone.

| Scenario | Required result |
| --- | --- |
| Research a future cabinet with budget, room measurements and owned tools | Comparison and open decisions saved to the right project; suggested purchases never marked owned |
| Begin in the app, reply by WhatsApp, add a product link by email | One coherent project/task history; verified identities; no duplicated project or allowance debit |
| “Actually it is 34 inches, not 36” arrives during research | Corrected measurement records its source; old result becomes stale; affected design, parts and guide need a fresh review |
| User has two active rooms and texts “make it deeper” | Ask which project/part and measurement; do not guess or modify either design |
| User says “Wagner 3500” and asks about orange peel | Resolve exact model/variant and coating/conditions; research matching instructions before settings; save confirmed equipment details |
| Sources disagree on foamboard adhesive or cutting method | Distinguish board chemistry and product; surface the conflict; withhold an unverified compatibility prescription |
| A manufacturer changes a specification after an accepted plan | Identify affected decisions, refresh evidence and show a reviewable change; keep historical drawings identifiable |
| User has already cut pieces and asks to revert | Show physical consequences, compare old/current pieces and create a reviewed revision rather than silently restoring obsolete instructions |
| Convert a 36-inch cabinet carcass into pet containment | Research welfare, fit, ventilation, entrapment and material gaps; do not claim the bookcase compiler validates the conversion |
| Duplicate, delayed, forged or forwarded messages; account A references account B's project | Reject unauthorized access, deduplicate legitimate events and resolve order conflicts without leaking project data |
| Provider outage, allowance exhausted, user pause or channel opt-out | Preserve task state, explain the stoppage once, stop the applicable job/delivery and resume only under valid authorization |
| Repeated private questions suggest a guide improvement | Produce a de-identified candidate with evidence and regression cases; publish only after review and versioning |

Definition of done for each stage: implemented behavior, migrations and recovery verified; account/permission and adversarial tests pass; mobile and channel UX tested; failures and limitations visible; no claims of capability ahead of the released engine.
