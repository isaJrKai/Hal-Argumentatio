# HALBiz buyer demo access

The buyer demo is deliberately disabled by default.

## Provision the isolated demo tenant

1. Against the intended PostgreSQL database, run `npm run provision:buyer-demo` with:
   - `HAL_DEMO_PROVISION_CONFIRM=true`
   - `HAL_DEMO_ACCOUNT_ID=<unique demo tenant ID>`
   - `HAL_DEMO_EMAIL=<dedicated demo email>`
2. Populate the tenant only with synthetic demonstration records. Never copy the owner's workspace, customer records, provider credentials, API keys, or personal data.
3. Verify that the account has role `user` and status `active`.
4. Verify tenant isolation and read-only behaviour before exposing the demo.
5. Set these Render environment variables:
   - `HAL_DEMO_LOGIN_ENABLED=true`
   - `HAL_DEMO_ACCOUNT_ID=<the dedicated demo contractor ID>`
6. Deploy the reviewed change and confirm `GET /api/auth/demo/status` returns `{"enabled":true}`.

The login screen displays **Explore buyer demo** only when the backend confirms that the configured account exists, is active, and is not an administrator.

## Security behaviour

- Disabled by default; both deployment settings are required.
- Issues a two-hour JWT only for the explicitly configured demo contractor.
- Administrator and suspended accounts are rejected.
- Authenticated demo sessions can use safe read methods only: `GET`, `HEAD`, and `OPTIONS`.
- All authenticated write methods are rejected centrally, not merely hidden in the interface.
- Public sign-in is rate-limited to 10 attempts per IP per 15 minutes.
- Do not store real customer information or live provider credentials in the demo tenant.

## Important limitations

- The provisioning script creates the isolated account only. It does not copy existing owner data or fabricate sample business records.
- The demo account must be populated with clearly synthetic examples before it is useful for a buyer walkthrough.
- The code does not change Render settings, create the production account, or deploy itself.
- Do not enable public demo access until the sample data and tenant isolation have been verified.
