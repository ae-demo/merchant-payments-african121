// mockEnv carries exactly the keys the platform emits for this component:
// this app's own THUNDER_AUTH_* OIDC keys (no THUNDER_AUTH_JWKS_URL — the
// browser never validates a token, so src/env.ts does not declare it). There
// is no sibling API URL key: payments-api is same-origin /api.
export const mockEnv = {
  THUNDER_AUTH_CLIENT_ID: "mock-client",
  THUNDER_AUTH_ISSUER: "https://mock-idp.test",
  // OIDC scopes are `group` and `ou`, singular, plus every catalog handle the
  // project declares (security.json permissions[]) — the platform requests
  // the whole catalog regardless of which role ends up holding which handle.
  THUNDER_AUTH_SCOPES:
    "openid profile email group ou balance:read disputes:read-all disputes:resolve " +
    "merchants:manage merchants:read-all merchants:review payment-links:create " +
    "payment-links:read payouts:create payouts:read payouts:read-all payouts:resolve " +
    "refunds:create transactions:read transactions:read-all",
  THUNDER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
