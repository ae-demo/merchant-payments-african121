// The ONE registered redirect URI, serving both the redirect leg and the
// silent-renew iframe leg — handleCallback() dispatches on request_type
// (thunder-authentication). Routed OUTSIDE the AuthzProvider: there is no
// session to read until the redirect has been processed.
import { useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { handleCallback } from "../authz/session";

export function CallbackPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    void handleCallback().then(() => navigate("/", { replace: true }));
  }, [navigate]);

  return (
    <main>
      <h1>Signing you in…</h1>
    </main>
  );
}
