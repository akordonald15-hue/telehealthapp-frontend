# Caretekk Frontend Staging

Use a separate Vercel project or Vercel environment for staging.

Recommended URL:

- `https://staging.caretekk.com`

Required environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://staging-api.caretekk.com/api/v1
BACKEND_API_BASE_URL=https://staging-api.caretekk.com/api/v1
NEXT_PUBLIC_WS_BASE_URL=wss://staging-api.caretekk.com
NEXT_PUBLIC_APP_URL=https://staging.caretekk.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Do not point staging frontend to:

- production API
- production WebSocket endpoint
- production OAuth client unless its redirect URLs are explicitly staging-only

Before security testing:

1. Deploy frontend from the same code branch as backend staging.
2. Confirm all API calls use `staging-api.caretekk.com`.
3. Confirm WebSocket traffic uses `wss://staging-api.caretekk.com`.
4. Confirm PWA/service worker cache is isolated by staging domain.
5. Confirm no real patient data appears after login.
