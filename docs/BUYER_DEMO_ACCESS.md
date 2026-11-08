# HALBiz buyer demo access

The buyer demo is deliberately disabled by default.

## Provision the isolated demo tenant

1. Create a dedicated ordinary contractor account in the production PostgreSQL database.
2. Populate it only with synthetic demonstration records. Do not copy the owner's workspace, customer records, provider credentials, API keys, or personal data.
3. Verify that its role is `user` and account status is `active`.
4. Set these Render environment variables:
   - `HAL_DEMO_LOGIN_ENABLED=true`
   - `HAL_DEMO_ACCOUNT_ID=<the dedicated demo contractor ID>`
5. Deploy the reviewed branch and confirm `GET /api/auth/demo/status` returns `{"enabled":true}`.

The app's login screen then displays **Explore buyer demo**. It requests a two-hour JWT for that one account without asking the visitor for an email, password, or Google identity.

## Security behaviour

- The endpoint is disabled unless both deployment settings are present.
- It can only issue a session for the explicitly configured contractor ID.
- Administrator and suspended accounts are rejected.
- Sessions expire after two hours.
- Authentication middleware centrally rejects all non-read HTTP methods for the configured demo tenant.
- Do not use this account for real customer information or connect live provider credentials to it.
- The demo tenant must contain synthetic records and be independently checked for tenant isolation before enabling public access.
- Demo login is rate-limited using the existing authentication rate limiter.

## Important limitation

The code does not automatically populate the demo tenant or change Render settings. Provision and verify the isolated tenant first; only then enable the environment variables. The demo button remains unavailable until the backend reports that demo access is enabled.
