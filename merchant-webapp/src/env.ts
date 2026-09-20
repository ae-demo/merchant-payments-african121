// Typed read of window._env_, the platform's runtime config (mounted as
// /env-config.js before the bundle runs — never build-time). Only the keys
// this app actually reads: the four OIDC keys thunder-authentication's
// session.ts uses (THUNDER_AUTH_ dependency name), no JWKS_URL (the browser
// never validates a token — the API gateway does), and no sibling API URL —
// payments-api is reached same-origin at /api (react-webapp), never through
// window._env_.
type Env = {
  THUNDER_AUTH_CLIENT_ID: string;
  THUNDER_AUTH_ISSUER: string;
  THUNDER_AUTH_SCOPES: string;
  THUNDER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
