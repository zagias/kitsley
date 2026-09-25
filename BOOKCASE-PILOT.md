# Bookcase pilot — 25 September 2026

One focused project flow: **Your design → Get ready → Make it**. Start at `/guides/bookcase`; the homepage links to it.

## Included

- Bounded plywood bookcase: 400–650 mm wide, 600–1000 mm high, 250–350 mm deep; actual 18 or 19 mm plywood, 1–3 fixed shelves with at least 150 mm clear openings, 6 mm applied back.
- One geometry model feeds the cut list, nine step drawings, shelf marks, pocket screw counts and back screw positions.
- Supplier cutting is the default; choosing self-cutting adds the saw, blade and guide to the tool list.
- Existing toolbox ownership and conservative offcut allocation feed the shopping list. Consumable quantities are not assumed available from a generic owned-item flag.
- Exact fastener types, 180/220 sanding grits, product examples, coating coverage, recoat/cure guidance, and wall-specific restraint prompts.
- Saved step, completion and finish choices. Design/method changes invalidate old completion without silently replacing an unsupported saved design.
- CSV cut/shopping lists and a standalone printable HTML guide with the same diagrams and instructions.
- Contextual AI help receives saved dimensions, options and current step. No AI request is needed for the illustrated guide. Existing account/plan checks still apply to AI help.

## Validation

122 automated tests pass, including 7 new workshop tests covering 162 supported dimensional combinations, part fit, shelf datums, screw schedules/counts, stock allocation, progress invalidation, backup roundtrip and export consistency.

Browser checks: changed width and shelf count propagate to saved cut list; finish/cutting changes update materials; completed step survives reload; changed geometry resets completion; nine distinct drawings inspected; 390 px phone frame has no horizontal overflow and next-step navigation lands at the next instruction. Help does not restart setup.

## Limits and next acceptance test

This is an original design, not a physically tested or manufacturer-certified bookcase. Product manuals substantiate component use, not a finished load rating. The UI and download state that limitation. No load capacity is claimed.

Before presenting this as a construction-validated paid pack, have a competent furniture maker review the joints and back fixing schedule, build the default size from the exported instructions, and observe a DIYer completing it. Record fit, assembly access, time, material waste and any unclear step. Revise from that evidence before rolling the pattern across the library.
