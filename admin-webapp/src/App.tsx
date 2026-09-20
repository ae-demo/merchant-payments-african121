// Adapted from thunder-authentication's assets/App.example.tsx for
// admin-webapp. The routing STRUCTURE here is prescribed by that skill:
//   - NoAccess sits ABOVE the shell route and REPLACES it.
//   - Forbidden sits INSIDE the shell, at /forbidden.
//   - /forbidden is wired into authz/client once, from inside the router.
//   - Every gated route is wrapped in <RequireOperation>, taken from
//     SCREEN_ROUTES.
//   - This app has no public screens (F1 "Platform admin oversight" is the
//     only flow and it carries a `role` line) — every screen sits behind the
//     sign-in guard, so PUBLIC_SCREENS is empty and nothing is routed above
//     it besides /callback.
//   - /callback is routed OUTSIDE the provider.
import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  AuthzProvider,
  Forbidden,
  NoAccess,
  RequireOperation,
  useAuthz,
  useScopes,
} from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens, hasScopedReach } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { APP_NAME } from "./appName";
import AppLayout from "./shell/AppShell";
import { CallbackPage } from "./pages/Callback";
import OnboardingQueuePage from "./pages/OnboardingQueue";
import MerchantReviewPage from "./pages/MerchantReview";
import AllTransactionsPage from "./pages/AllTransactions";
import AllPayoutsPage from "./pages/AllPayouts";
import DisputesPage from "./pages/Disputes";
import DisputeDetailPage from "./pages/DisputeDetail";
import { Box, CircularProgress, Typography } from "@wso2/oxygen-ui";

/** YOUR pages, keyed by the screen keys src/authz/screens.ts declares. */
const PAGE_BY_KEY: Record<string, ReactElement> = {
  onboarding: <OnboardingQueuePage />,
  "merchant-review": <MerchantReviewPage />,
  transactions: <AllTransactionsPage />,
  payouts: <AllPayoutsPage />,
  disputes: <DisputesPage />,
  "dispute-detail": <DisputeDetailPage />,
};

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

/** Hands src/authz/client.ts the route a refusal goes to, once, from inside
 * the router and above every route. */
function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography color="text.secondary">Checking your session…</Typography>
    </Box>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // Load-time guard. Only a MISSING session starts a sign-in: currentUser()
  // already tried a silent renew, and signing in on a merely expired token
  // re-logs the user in on every visit.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  // NoAccess REPLACES the shell — no rail around "you have no access".
  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  const landing = (reachable.find((s) => !s.public && s.loads !== null) ?? reachable[0]).path;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          const page = PAGE_BY_KEY[screen.key];
          if (screen.loads === null) {
            return <Route key={screen.key} path={screen.path} element={page} />;
          }
          return (
            <Route
              key={screen.key}
              element={<RequireOperation op={screen.loads} screen={screen.label} />}
            >
              <Route path={screen.path} element={page} />
            </Route>
          );
        })}
        {/* Forbidden is INSIDE the shell: the rail the caller can use stays. */}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
