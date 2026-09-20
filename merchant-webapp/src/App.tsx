// Adapted from thunder-authentication's assets/App.example.tsx. The ROUTING
// STRUCTURE is prescribed, not a style choice:
//
//   NoAccess sits ABOVE the shell route and REPLACES it.
//   Forbidden sits INSIDE the shell, at /forbidden.
//   /forbidden is wired into authz/client ONCE, from the router.
//   Every gated route is wrapped in <RequireOperation>, the operation taken
//     from SCREEN_ROUTES.
//   A `public` screen (F2 — no `role` line in wireframes.dsl: PayLink,
//     PayMobileMoney, PayCard, PaymentReceipt) is routed ABOVE the sign-in
//     guard, inside AuthzProvider, outside AppShell — a visitor with no
//     session has no signed-in chrome to draw.
//   /callback is routed OUTSIDE the provider.
import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthzProvider, Forbidden, NoAccess, RequireOperation, useAuthz, useScopes } from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens, hasScopedReach } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { AppShell } from "./shell/AppShell";
import { APP_NAME } from "./appName";
import { CallbackPage } from "./pages/Callback";
import { OnboardingPage } from "./pages/Onboarding";
import { DashboardPage } from "./pages/Dashboard";
import { CreatePaymentLinkPage } from "./pages/CreatePaymentLink";
import { PaymentLinkDetailPage } from "./pages/PaymentLinkDetail";
import { PaymentLinksPage } from "./pages/PaymentLinks";
import { TransactionsPage } from "./pages/Transactions";
import { PayoutsPage } from "./pages/Payouts";
import { RequestPayoutPage } from "./pages/RequestPayout";
import { PayLinkPage } from "./pages/PayLink";
import { PayMobileMoneyPage } from "./pages/PayMobileMoney";
import { PayCardPage } from "./pages/PayCard";
import { PaymentReceiptPage } from "./pages/PaymentReceipt";

/** YOUR pages, keyed by the screen keys src/authz/screens.ts declares. */
const PAGE_BY_KEY: Record<string, ReactElement> = {
  onboarding: <OnboardingPage />,
  dashboard: <DashboardPage />,
  "create-payment-link": <CreatePaymentLinkPage />,
  "payment-link-detail": <PaymentLinkDetailPage />,
  "payment-links": <PaymentLinksPage />,
  transactions: <TransactionsPage />,
  payouts: <PayoutsPage />,
  "request-payout": <RequestPayoutPage />,
  "pay-link": <PayLinkPage />,
  "pay-mobile-money": <PayMobileMoneyPage />,
  "pay-card": <PayCardPage />,
  "payment-receipt": <PaymentReceiptPage />,
};

/** The screens reachable before sign-in — routed above the guard, below. */
const PUBLIC_SCREENS = SCREEN_ROUTES.filter((screen) => screen.public);

export default function App(): ReactElement {
  return (
    <BrowserRouter>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        {PUBLIC_SCREENS.map((screen) => (
          <Route
            key={screen.key}
            path={screen.path}
            element={<AuthzProvider fallback={<Splash />}>{PAGE_BY_KEY[screen.key]}</AuthzProvider>}
          />
        ))}
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

/**
 * Hands src/authz/client.ts the route a refusal goes to. ONCE, from inside the
 * router and above every route.
 */
function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Checking your session…</p>
    </main>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // The load-time guard. Only a MISSING session starts a sign-in.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  const landing = (reachable.find((s) => !s.public && s.loads !== null) ?? reachable[0]).path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          if (screen.public) return null;
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
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
