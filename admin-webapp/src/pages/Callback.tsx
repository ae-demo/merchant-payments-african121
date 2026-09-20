// The one registered redirect URI, for both the redirect leg and the silent
// renew's hidden iframe. handleCallback() (session.ts's signinCallback())
// dispatches on request_type and settles; this page renders from the promise
// settling, never from a value.
import { useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";

export function CallbackPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    void handleCallback().finally(() => {
      if (live) navigate("/", { replace: true });
    });
    return () => {
      live = false;
    };
  }, [navigate]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 2 }}>
      <CircularProgress />
      <Typography color="text.secondary">Signing you in…</Typography>
    </Box>
  );
}
