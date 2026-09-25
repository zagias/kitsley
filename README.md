# Kitsley

A working Next.js woodworking project planner: describe a project, build an equipment kit, follow focused steps, and save progress.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev -- --port 3017
```

Open http://127.0.0.1:3017. Production validation: `npm test` and `npm run build`.

## Included

- Responsive landing page, project library, toolbox, and saved projects.
- Ten supported woodworking projects and 56 generic equipment entries.
- Essential, recommended, and optional priorities; owned items excluded from buying estimates.
- Project-specific step checklists, material tips, and focused guide answers.
- Browser-local saved projects and completion state.
- Canadian retailer search links with tracked redirects.
- Token-protected admin at `/admin`: equipment editing, merchant destinations, project priorities, and activity counts.
- Atomic local JSON storage for catalog edits and referral events.

## Configure admin

Copy `.env.example` to `.env.local`. Set `ADMIN_TOKEN` to a random secret at least 24 characters long and restart the server. Enter that secret on `/admin`. No token is shipped. Admin tokens are held in memory by the page, not browser storage.

`KITSLEY_DATA_DIR` controls the server data directory; it defaults to `.data`. Do not commit `.env.local` or `.data`.

## Honest preview boundaries

This is a working local MVP, not a deployed production service. No domain was purchased and no GitHub repository was changed.

The advisor currently matches descriptions to ten project types using local rules. The question panel answers supported questions from the project guide; no live language model is connected. `lib/advisor.mjs` is the adapter boundary for project interpretation. An eventual model must return a validated project ID; the catalog retains control of equipment, merchant URLs, and priorities.

Prices are illustrative CAD equipment ranges, not live offers. Raw stock, quantities, tax and delivery are excluded. Retailer links are searches until real product/affiliate destinations are configured. Tracked clicks are not attributed purchases or verified revenue.

Guides are planning outlines, not dimensioned construction drawings. They require applicable designs, load checks and manufacturer instructions. Project matching does not understand arbitrary constraints or mixed projects.

Saved plans are browser-local and represent a snapshot; regenerate after changing your toolbox. One saved plan is retained per project type. Server JSON storage is suitable for a single local process; production should use a transactional database and durable storage, with rate limiting and an account-based admin login.

## Code map

- `app/page.js`: interactive planner, library, toolbox, saved plans, illustrations.
- `app/globals.css`: responsive styling.
- `lib/catalog.mjs`: generic equipment, projects and retailers.
- `lib/guides.mjs`: project outlines and material tips.
- `lib/engine.mjs`: equipment prioritization and budget calculations.
- `lib/advisor.mjs`: replaceable project interpretation adapter.
- `lib/store.mjs`: local catalog and event persistence.
- `app/api/recommend/route.js`: validated project-plan endpoint.
- `app/api/admin/route.js`: authenticated catalog changes.
- `app/go/[id]/route.js`: merchant validation and click tracking.
- `lib/safety-guides.mjs`: the six Urgent issues & safety topics as safety guides — when to call 911, a safety briefing, ordered steps with per-step safety notes, when to call a professional, a shared disclaimer and cited Canadian/public sources. These are safety steps, not repair instructions.
- `tests/safety.test.mjs`: every safety topic has a briefing, steps and sources; no guide tells people to shut off gas or reach a panel through water; the disclaimer puts 911 first.
- `tests/design.test.mjs`: accent text colours (`--orange-text`, `--teal-text`) keep at least 4.5:1 contrast on page, card and tint backgrounds.
- `tests/engine.test.mjs`: project coverage, ownership budgets, safety priorities, material rejection, matching and URL validation.

## Expanded household library

The library now contains **76 topics in 11 categories**, including drywall, pavers, planting beds, yard care, plumbing, electrical, maintenance and urgent issues. It supports keyword/synonym search, category and intent filters, guide-type filters and alphabetical sorting.

Ten entries retain the original project guides and equipment plans. The remaining 66 entries are explicitly labeled planning/safety briefs; they are not full installation procedures. Their toolbox checks list preparation equipment only. Urgent and electrical entries prioritize safety and do not offer a shopping checklist.

The toolbox now includes all 75 equipment and supply entries, with search. Readiness checks show owned and missing items, conditional substitutes, and retailer search links. Potential substitutes are never automatically marked as equivalent. Generic safety items have no substitution rules. Existing server catalog files merge new seed IDs while preserving admin edits.

## Google and Apple sign-in

Implemented with Supabase Auth and cookie-based PKCE. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and the exact `APP_URL` in `.env.local`. Do not use a service-role secret for the publishable-key setting. Enable the provider flags only after each provider is configured in Supabase.

1. Follow [Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google) to configure the Google OAuth client and Supabase provider.
2. Follow [Supabase Apple setup](https://supabase.com/docs/guides/auth/social-login/auth-apple) for the Apple Services ID and signing credentials. Observe Apple's domain/return URL requirements and client-secret renewal requirements.
3. Configure Supabase's Site URL and allowlisted app redirect URL: `APP_URL/auth/callback`. The provider's own callback is the Supabase callback from its dashboard, not the app callback.
4. Set `AUTH_GOOGLE_ENABLED=true` and/or `AUTH_APPLE_ENABLED=true`, then restart.

No real OAuth round trip has been verified: the necessary provider credentials are not configured. The sign-in dialog keeps unsupported methods disabled and guest access available. Server sign-in/sign-out mutations require the configured origin. The account route validates the session with `getUser`, refreshing cookies in a route handler, and uses private/no-store responses. The callback exchanges the PKCE code and redirects only to the configured site.

Authentication does not yet sync toolbox or saved projects between devices, grant paid entitlements, or grant catalog admin access. The admin token remains separate.

See [COMMERCIAL-MODEL.md](COMMERCIAL-MODEL.md) for the proposed capped membership and “Save a Buck” feature. These commercial features are not activated.

## Library and toolbox update — September 24, 2026

The workspace now has reloadable routes: `/library` (query, category, mode and kind filters), `/guides/<id>`, `/toolbox`, `/projects`, `/urgent`, and `/plan/<id>` (material, finish and selected tab). Browser history returns to prior screens. Guides can be shared without browser storage; personal ownership, saved plans and progress remain local to the browser. A plan URL on a new device opens its configured planner; it does not transfer private saved progress.

Search ranks individual normalized terms, including door-contact synonyms. Step-by-step guides lead unfiltered browsing; relevance leads searches, with guide depth breaking ties. No-result searches show three suggestions, using near spelling where possible and naming a likely category only when there is evidence. The catalog still contains 10 step-by-step guides and 66 planning briefs. Brief summaries describe initial review time and preparation equipment costs, not a complete repair estimate. Equipment ranges remain illustrative CAD values, not live quotes.

The palette from `kitsley-colors.css` is incorporated into the base stylesheet. Typography uses six sizes (12–40px), primary controls have at least 44px touch targets, and navigation changes to the mobile layout at 760px. The toolbox has seven groups and an eight-item starter kit. Inline ownership updates recalculate saved plan equipment budgets.

Validation: 26 automated tests (including accent-text contrast and safety-guide checks); production build; browser checks of the reported bathroom-door sentence, Enter submission, no-result suggestions, guide save/reload, Back navigation, saved-plan progress/tab history, urgent screen, and layouts at 390px and 740px.

## Project-value and paid-offer experiment

Guide workspaces now save checklist progress, observations and manually entered purchase quotes to the existing browser-local My projects entries. The detailed kit is collapsed initially, with direct links to the instructions and Save a Buck. The sticking-door brief includes a conditional guided check with manufacturer/retailer sources; it is not an AI diagnosis. Existing safety guides remain accessible without a paid upsell.

`/offers` presents proposed prices only. `/api/offer-interest` accepts explicit anonymous offer preferences, validates same-origin requests and input size, and updates one choice per browser ID/version in the local store. Authorized `/admin` shows the research counts. No payments or live AI requests occur. The user-visible disclosure identifies the data submitted; no email or payment data is collected. These counts are neither revenue nor proof of willingness to pay.

`lib/project-experience.mjs` holds the offer hypotheses and quote math. Quote comparisons require the same item, quantity and specification text, plus user-confirmed suitability. Lowest delivered price uses unit price × quantity + delivery + tax. There is no live pricing, stock check, professional compatibility certification or guaranteed savings.

After this update, 31 automated tests pass. Browser checks covered checklist/note/quote persistence after reload, delivered-price comparison, conditional door guidance and the mobile offer page. The updated preview uses port 3019 because an externally managed server still occupies 3018. Browser-local saved data is separate for each port; original data on 3018 is unchanged.


### Bookcase pack prototype
`/packs/bookcase` generates front/side SVG views, an exploded reference, a finished cut list and planning sequence from validated integer dimensions. Saves a versioned design under the existing bookcase project; toolbox changes remain synchronized. Plywood offcuts are stored separately in `kitsley-sheet-stock`; conservative one-stock-piece-per-part matching deliberately does not optimize yield. Download standalone printable HTML or cut-list CSV.

35 tests pass, including geometry closure, invalid dimensions, stock allocation and export consistency. This is a geometry preview, not a released fabrication plan: joinery, hardware sizes, load capacity and anchoring are not engineered. OpenAI, billing and live prices remain disconnected.

### Illustrated manual
The bookcase pack now includes six original SVG assembly panels (parts, square/clamps, joint review, shelf layout, back panel with conditional nailer illustration, and wall restraint). The same panels appear in the printable HTML. Review progress is saved with the dimensioned design and resets on dimension changes. 37 automated tests pass; desktop navigation, persistence and phone overflow checked. The illustrations are schematic planning aids, not approved joint or fastening instructions.

### Prep & paint and pre-export customization
Material-specific finishing guidance supports bare plywood, MDF, solid wood, laminate/melamine and previously painted wood. Brush/roller, sprayer and aerosol methods have separate advice; product instructions remain authoritative. Finishing choices and a free-text customization brief persist with the saved pack and appear in the printable draft. The pre-export review identifies unapplied requests. No AI inference is simulated: live AI is still unconnected, and the structural template remains plywood. 39 tests pass; material switching, review screen and mobile overflow checked.
