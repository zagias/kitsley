# Account workspace sync

Google-authenticated users use `/api/workspace`, backed by `account_workspaces` in Supabase. Apply `supabase/migrations/20260925_account_workspace.sql` once before deploying. Only the existing Supabase URL and publishable key are needed; never add a service-role key to the browser.

The server verifies the session with `getUser`; user identity never comes from the request body. RLS restricts records to `auth.uid()`. The invoker RPC atomically compares revisions, so stale writes cannot replace current cloud data. Anonymous access is revoked.

Conversations (including briefs, messages, drawings/configurations, quotes, shortlists and progress), saved guides/designs, toolbox ownership, material stock, legacy drafts and offer preferences are included. Recent searches derive from the conversations. Unsaved form inputs, downloaded files, GPS positions, authentication tokens and API keys are not part of workspace data.

Browser caches are separated by user ID. Legacy guest data is claimed by the first signed-in account once per browser, and removed from the guest workspace only after successful sync. Signing out checks that outstanding changes have synced, then reloads into a separate guest workspace. Account changes in another tab trigger a reload.

Changes sync after 650 ms, on focus/reconnection, and every 15 seconds while visible. A failed request retains the local device copy and shows a retry status. Initial account verification requires connectivity. Limits are 3 MB and 6,000 entities per account workspace in the application. Simultaneous changes to different records merge. Conflicting versions are retained in cloud recovery records (Account → Download recovered versions); deletion wins against stale edits. Recovery is a JSON export, not a point-in-time database backup.

Manual verification: sign into the same account in two separate browser profiles/devices, create a project and change a tool on one, then focus the other. Test edits, deletion, offline/reconnect, sign out, and a different Google account. Database test transaction must be rolled back. No billing entitlement or paid subscription is inferred from sign-in.
