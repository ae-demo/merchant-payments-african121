// Typed read of window._env_, the platform's runtime config — mounted as
// /env-config.js before the bundle runs. Never import.meta.env.* here (that is
// build-time and this platform does not use it).
//
// This app's only auth dependency is `thunder-auth` (UPPER_SNAKE: THUNDER_AUTH),
// a platform-resource of type thunder-app. It emits CLIENT_ID, ISSUER, JWKS_URL,
// SCOPES and RESOURCE; JWKS_URL is not declared here because the browser never
// validates a token — the API gateway does.
//
// There is no sibling API URL key: payments-api is reached same-origin at
// `/api`, proxied by nginx from pod env, never from window._env_.
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
