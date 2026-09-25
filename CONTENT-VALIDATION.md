# Kitsley content and drawing review — 24 September 2026

This release improves the 29 project packs. It does not certify a construction design or convert every library entry into a complete installation manual.

## Coverage

| Content | Count | What it contains |
| --- | ---: | --- |
| Step-by-step guides | 12 | Bounded owner/DIY procedures, scope, pause conditions, five actions with checks, topic-specific source links and core tool checks. |
| System-specific guides | 16 | Selection, preparation, installation checkpoints and handover sequence; exact product, fastener, wall, ground or load specifications still come from the chosen system or competent review. |
| Drawing + review | 1 | Parametric bookcase, measured and exploded views, six illustrated assembly references, cut list, independent geometry audit and revision-bound construction notes. |
| Existing safety guides | 6 | Safety-first guidance retained. |
| Other planning briefs | 41 | Remain short assessment/planning content. They have not been promoted to complete procedures. |

The 29 packs contain 145 new written steps, each with an observable checkpoint. Sources are in `lib/content-sources.mjs`; each records the topic it supports. Linked manufacturer plans are separate designs, not permission to transfer their load ratings or joints to Kitsley's adjustable bookcase. Guidance is original synthesis and needs editorial/trade review before being marketed as expert-verified.

Procedure guides: small drywall patch, room painting, mulch top-up, door weatherseal, user-accessible HVAC filter replacement, patio cleaning, cabinet painting, cosmetic furniture refinishing, in-ground planting bed, plant selection, compatible interior door-handle replacement, ground-level seasonal walkthrough.

System-specific guides: shelves, raised bed, paver path, pegboard, cabinet doors, drawers, workbench, planter, garden storage, trellis, garden edging, drip irrigation, paver patio, paver edging, trim, curtain rail.

## What the user sees

A project brief leads to one current instruction at a time. The guide first states its scope and conditions for pausing. Checkboxes record the user's observations; they are not independent verification. Progress survives reload and backup, and resets if the brief or dimensions change. Sources and calculators stay collapsed until needed. The library labels and filters distinguish procedures, product-dependent guides, drawings, briefs and safety guidance.

Tools continue to compare against the user's toolbox. Procedure kits now cover their core reusable tools. Material requirements and additional equipment are explicit and included in printable exports; they are not a fully specified shopping order. Referral links retain their existing configuration-dependent behavior.

Paint, mulch and paver worksheets use entered measurements and actual product coverage. They show units, assumptions and rounded-up container quantities. Blank, negative, nonfinite, out-of-range and otherwise invalid inputs are rejected. Soil volume remains the existing internal raised-bed calculation. None of these calculate structural loading, live stock or retailer prices.

## Bookcase validation boundary

Automated checks verify:

- Finite whole-number inputs and the supported model range.
- The exact quantity and dimensions of A sides, B top/bottom, C shelves and D applied back.
- Horizontal and depth dimension closure, including the 6 mm back.
- Minimum clear openings, vertical closure and shelf underside positions from a single bottom datum.
- Agreement between the dimensioned SVG shelf positions and independently calculated shelf datums across 729 valid sampled configurations.

Still unresolved for an actual construction design:

1. Plywood product/grade, measured thickness and material condition.
2. Every joint: connection type, fastener model/count/position, pilots, edge distances and compatible adhesive.
3. Back attachment and resistance to racking.
4. Shelf deflection, concentrated/distributed loads, joint capacity and cabinet stability.
5. The furniture restraint, cabinet attachment, wall substrate and appropriate wall fixings.

The app provides fields for a competent reviewer’s actual specifications and document references. Notes are attached to the dimension/rule-set fingerprint. A changed design marks prior notes stale; starting a new review retains up to five previous review records. A completed form never changes `constructionApproved` to true. Draft exports always show the remaining review requirement. There is no engineer approval, independent load test or automated structural calculation in this release.

To release a construction-ready template, obtain a complete original or appropriately licensed connection/material specification, a documented review of the intended size/load range, and a physical build/fit check. Then encode those constraints and tests into the template. Do not merely relabel this geometry model as validated.

## Verification

- `npm test`: 66 passing tests, including corrupt geometry, source references, kit IDs, quantity boundaries, escaped exports, backup roundtrips, stale review notes and unchanged finishing preferences after a dimension edit.
- `npm run build`: passes.
- Browser: painting prompt/intake → scope → one-step reader; checked step and active step survive reload; 4 × 3 × 2.5 m room with 3 m² openings, two coats, 10 m²/L coverage and 10% allowance gives 7.04 L / two 5-L tins.
- Browser: bookcase audit displays all seven dimension checks and shelf datums. Width change from 740 to 750 mm marks the previous review stale without presenting approval.
- Browser: updated library badges/order; 390 px reader and expanded calculator fit without horizontal overflow; viewport restored afterward.

Live AI remains separately configured. Its guide context now includes the scoped instructions and source metadata. It is not required for the procedure reader, drawings, calculations or local saves. Hosting and payment integration are outside this content change.
