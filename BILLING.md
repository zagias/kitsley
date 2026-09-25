# Kitsley commercial model and Stripe launch

Status: implemented locally; payments remain disabled. Do not enable sales until the tests below pass against the real Stripe test account. Existing email/phone provider work remains paused.

## Launch pricing hypothesis (CAD, tax additional)

| Plan | Price | Entitlement |
|---|---|---|
| Free | $0 | 3 AI replies per project; 3 projects per UTC calendar month |
| Project Pass | $19 once | One account-owned conversation/project; 30 days from payment; 30 replies; 6 retailer comparisons |
| Plus | $29/month | 3 distinct projects used per billing period; 90 replies total; 18 retailer comparisons |

Static guides, toolbox, saved work and urgent guidance stay free. No overages or rollover. Reopening an existing project in a new billing period counts toward that period's three projects. A pass does not auto-renew. A paid pass is used first; Plus can cover further requests when the pass is exhausted. A fourth project can use a separate pass. Keep annual plans, lifetime plans, and unlimited AI out of the initial launch.

Sell a result: a tailored path, tool/material gaps and specific help as the customer works. Provide genuinely useful free advice before asking for payment. Do not promise a drawing for arbitrary renovations: supported bookcase geometry is the current example, and construction validation remains separate. Existing client-side sample packs remain public; billing protects live AI and retailer services, not those public samples. A production library of construction-reviewed paid drawings is separate unfinished work.

Pricing is not validated unit economics. Initially target total variable costs below 20% of net revenue (CAD $3.80/pass, $5.80/Plus before considering tax), including model/search usage, payment fees, delivery infrastructure and refunds. `billing_usage` records tokens and search counts; use actual provider invoices and exchange rates to calculate costs. Measure free-to-paid conversion, fully used allowances, repeat projects, renewal, refund rate and support time. Revisit pricing after 30–50 paying users, without retroactively changing existing plan promises. Referral commissions are supplemental; rankings should follow customer fit and total cost.

## Server setup

1. Apply `supabase/migrations/20260925_billing.sql` after the account-workspace migration. All billing tables and quota RPCs are inaccessible to anon/authenticated clients. Only a server secret may change them.
2. Configure `SUPABASE_SECRET_KEY` as a server-only Supabase secret/service-role key. Never prefix it NEXT_PUBLIC or expose it to client code.
3. Create Stripe CAD products: Project Pass, one-time 1900 cents; Kitsley Plus, monthly 2900 cents. Set `STRIPE_PRICE_PROJECT_PASS`, `STRIPE_PRICE_PLUS`, `STRIPE_SECRET_KEY`, `STRIPE_MODE=test` initially.
4. Add `/api/billing/webhook` with events: checkout.session.completed, checkout.session.async_payment_succeeded, invoice.paid, customer.subscription.updated, customer.subscription.deleted, charge.refunded, charge.dispute.created. Set `STRIPE_WEBHOOK_SECRET` from that endpoint. REST requests pin `2025-06-30.basil`; event handling retrieves current objects rather than trusting event snapshots.
5. Enable Stripe Customer Portal cancellation at period end and payment-method management. Keep plan switching, quantity changes, free trials and coupon entry disabled until specifically supported.
6. Configure business identity, tax treatment/registrations, product tax codes, support/refund policy, and Stripe receipts. Set STRIPE_AUTOMATIC_TAX=true only after Stripe Tax is configured. Set APP_URL to the deployed HTTPS origin.
7. Set BILLING_ENABLED=true in a test deployment. Leaving it false keeps the existing bounded preview and closes checkout; it is not production entitlement enforcement. Billing-enabled requests fail closed when account/database checks fail.
8. After all acceptance tests, use live prices/keys/webhook and STRIPE_MODE=live. Do not merely swap the API key while keeping test price IDs.

## Behavior and operational limits

- Checkout requires verified Supabase identity; a Project Pass additionally requires a synced owned project. Price, currency, interval and quantity come from the server.
- Checkout return URLs cannot grant access. Signed, time-checked Stripe webhooks verify paid status and account association before adding an immutable grant.
- Idempotent checkout attempts and Stripe customer/subscription checks prevent ordinary double-click duplicates. Replayed payment events cannot extend access. Each Plus invoice supplies one quota period.
- Quotas are reserved transactionally under a database lock. Explicit provider failures delete that reservation. Process death after reservation can consume a reply; inspect and restore stranded requests through server administration when necessary. No self-service client can refund its own usage.
- Daily service ceilings in the migration: 1,000 AI replies and 200 retailer searches across all accounts. Adjust through a reviewed migration as usage grows; the pre-billing preview retains its older single-server caps.
- Full or partial refunds revoke the affected purchase/period; disputes do likewise. Canceled/unpaid/paused subscriptions lose access. Cancellation scheduled at period end retains paid access until expiry. Failed renewal never creates a new grant.
- The app never deletes customer projects on expiration/cancellation. There is no automatic refund or financial transaction from the app itself.

## Validation

Run `npm test`, `npm run build`. `tests/billing-database.sql` is a rollback assertion suite for a disposable local database with auth.users and account_workspaces fixtures and the migration applied. It checks quotas, ownership, expiry, refunds of usage and client permissions.

Required external acceptance before charging: successful/declined card, cancellation and return, simultaneous checkout clicks, duplicate webhook, late invoice delivery, renewals using Stripe Test Clocks, failed renewal, cancel-at-period-end, immediate cancel, refund/dispute before and after event delivery, reconnect on a second device, and plan reactivation after payment. These require the user's Stripe/Supabase credentials and have not been run against live services.

Sandbox checkout is restricted to `BILLING_TEST_USER_ID`. Public visitors cannot purchase test entitlements. Set this to the tester’s Supabase user ID; never enable live mode before end-to-end testing.
