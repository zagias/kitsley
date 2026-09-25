# Heroku deployment

Node 22, the standard Node.js buildpack and a web dyno are required. Heroku runs the build script, then Procfile starts Next on 0.0.0.0 using its PORT environment variable.

Initial deployment is a guided preview: set KITSLEY_AI_ENABLED=false and AUTH_GOOGLE_ENABLED=false and AUTH_APPLE_ENABLED=false. Set APP_URL to the assigned HTTPS URL. Do not upload .env files or .data.

Before enabling live AI or relying on server records, replace the local JSON store with durable database storage. Heroku dyno files are ephemeral, so catalog edits, referral events, offer-interest records and AI quota counters currently reset on restart. User projects/tool ownership live in browser localStorage; localhost records do not automatically transfer to the deployed origin. Use the workspace backup/import feature.

Deployment awaits Heroku sign-in, app selection/creation and hosting-plan approval. No remote app has been created or deployed yet.
