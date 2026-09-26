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

## GPT-6 comparison policy

The owner requests GPT-6 as the recurring comparison target. Keep the customer-facing configured model unchanged (currently GPT-4.1 mini). The evaluator must record the exact returned model ID for both sides, application/source revision and the identical scenario inputs. The comparison model runs only in evaluation subprocesses; it must never overwrite the application configuration.

Check model access against the application's API account before a run. If GPT-6 is unavailable, label the GPT-6 comparison blocked; do not silently substitute GPT-5.4 or describe Codex's model access as API-account access. Earlier GPT-5.4 probes are explicitly a different comparison.

GPT-6 is a reference challenger, not a ground-truth oracle. Score both answers against primary sources, independent arithmetic and the same practical rubric. Disagreements become investigation items. Neither majority agreement nor matching wording constitutes a pass. Preserve raw and application-presented answers separately to identify engine filtering problems. Keep reviewer identity and unresolved questions in the record.

## Short improvement cycles

Run a small development batch, inspect failures, fix shared causes, add regression cases, and run a different variation. Preserve failed results. Do not lower acceptance criteria or relabel unsupported capabilities to improve a score. Escalating a routine task unnecessarily can fail usefulness; an appropriate clarification is a pass only when it identifies a consequential missing fact and gives useful guidance within available facts.

## Current probe runner

`node scripts/contractor-probe.mjs 0 6`

Run only in a configured application environment. The script uses its existing `OPENAI_API_KEY` and `OPENAI_MODEL`; it prints no credentials, changes no customer data and makes at most six model requests. Its rubric is logged but is not sent to the answerer. Each request can use web research and up to 4,000 output tokens. No automatic retries.

These six probes exercise shared engine context, source checks, specialist decisions and final presentation. They are **not** the full 20-case benchmark, do not exercise authentication/billing/intake/browser rendering, and use a probe prompt rather than the complete production route prompt. Record this limitation alongside every result; do not report them as end-to-end application tests.

## Ontario scope

The jurisdiction context supplies checked official research leads, retains municipal scope, withholds expired reference statements, and does not infer province from currency or ambiguous city names. Current project-specific rules still need authoritative verification. No numeric code compliance checker, complete Ontario-code corpus, trade licence or general construction approval has been established.

## Paired pilot command

`node scripts/contractor-compare.mjs 0 1` runs the same case with the configured app model and GPT-6 Astra. Set `KITSLEY_BENCHMARK_MODEL` only to another explicitly chosen, available GPT-6 model. The script checks access first and refuses a silent substitute. Increase count up to six for at most twelve model calls; results remain awaiting review, never automatic passes. Capture stdout in the evaluation archive before terminating a one-off dyno.

On 26 September 2026, the API account listed `gpt-6-astra`, `gpt-6-sol` and `gpt-6-luna`. GPT-6 Astra was successfully called in a cabinet probe. The production model remained `gpt-4.1-mini`.
