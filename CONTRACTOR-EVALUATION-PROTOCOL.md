# Kitsley contractor benchmark: iterative evaluation protocol

The target is the practical judgement expected of a contractor with ten years of relevant experience, separately in each trade. It is not a count of stored records or software tests.

## Acceptance gate

For each of cabinetry, cabinet doors, adhesives, fastening, finishing and materials:

- At least 18 of 20 complete realistic cases must pass, with no critical safety, dimensional, compatibility or Ontario-code error.
- Repeat on a separately authored set of 20 unfamiliar variations after the fixes. Do not disclose expected answers to the answering model.
- Each case includes a follow-up that changes a fact or supplies missing information. Evaluate the presented result, not only the raw model response.
- Assess task understanding, practical usefulness, correct specification, consistent dimensions/artifacts where supported, diagnosis/adaptation, and jurisdiction/trade boundaries.
- A critical error fails the area even if the average is high. An unresolved case is not a pass. An outage is an execution failure, not evidence of knowledge.
- Model grading can triage failures but cannot certify a trade. Keep answers, evidence, actual model/version, application revision, reviewer and reasons. Independent qualified review and field outcomes remain distinct evidence.

## Short improvement cycles

Run a small development batch, inspect failures, fix shared causes, add regression cases, and run a different variation. Preserve failed results. Do not lower acceptance criteria or relabel unsupported capabilities to improve a score. Escalating a routine task unnecessarily can fail usefulness; an appropriate clarification is a pass only when it identifies a consequential missing fact and gives useful guidance within available facts.

## Current probe runner

`node scripts/contractor-probe.mjs 0 6`

Run only in a configured application environment. The script uses its existing `OPENAI_API_KEY` and `OPENAI_MODEL`; it prints no credentials, changes no customer data and makes at most six model requests. Its rubric is logged but is not sent to the answerer. Each request can use web research and up to 4,000 output tokens. No automatic retries.

These six probes exercise shared engine context, source checks, specialist decisions and final presentation. They are **not** the full 20-case benchmark, do not exercise authentication/billing/intake/browser rendering, and use a probe prompt rather than the complete production route prompt. Record this limitation alongside every result; do not report them as end-to-end application tests.

## Ontario scope

The jurisdiction context supplies checked official research leads, retains municipal scope, withholds expired reference statements, and does not infer province from currency or ambiguous city names. Current project-specific rules still need authoritative verification. No numeric code compliance checker, complete Ontario-code corpus, trade licence or general construction approval has been established.
