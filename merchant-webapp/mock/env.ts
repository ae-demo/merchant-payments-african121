// What window._env_ holds in mock mode — exactly the keys the platform emits
// for this app's `thunder-auth` dependency (react-webapp's mock-mode.md).
// The OIDC scopes are `group` and `ou`, SINGULAR, plus this project's own
// catalog handles from specs/design/security.json.
export const mockEnv = {
  THUNDER_AUTH_CLIENT_ID: "mock-client",
  THUNDER_AUTH_ISSUER: "https://mock-idp.test",
  THUNDER_AUTH_SCOPES:
    "openid profile email group ou merchants:manage payment-links:create payment-links:read " +
    "transactions:read balance:read payouts:create payouts:read refunds:create",
  THUNDER_AUTH_RESOURCE: "https://mock-idp.test/resources/merchant-payments-african121",
};
