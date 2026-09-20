/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Adapted from thunder-authentication's assets/screens.example.ts.
//
// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS. specs/design/security.json
// carries no screen table at all.
//
// merchant-webapp's screens, in RAIL ORDER, from
// specs/design/components/merchant-webapp/wireframes.dsl:
//
//   F1 (role Merchant, signed in) — Onboarding, Dashboard, CreatePaymentLink,
//   PaymentLinkDetail, PaymentLinks, Transactions, Payouts, RequestPayout.
//   Only Dashboard/PaymentLinks/Transactions/Payouts carry the wireframe's
//   sidebar — CreatePaymentLink/PaymentLinkDetail/RequestPayout are reached by
//   button from those screens rather than the rail, but every one of them
//   still renders inside the one AppShell shared by every signed-in screen.
//
//   F2 (no `role` line — PUBLIC) — PayLink, PayMobileMoney, PayCard,
//   PaymentReceipt. Routed above the sign-in guard, per this skill's §6.
//
// Onboarding is listed first because it is genuinely the merchant's landing
// screen the first time they sign in (a merchant with no profile yet, or one
// still pending/rejected, has nothing else to do); its own page redirects an
// already-approved merchant on to Dashboard once its GET resolves. `loads` is
// "GET /me/merchant" (not the PUT the form submits) because that is the read
// this screen renders on open and the same scope, merchants:manage, gates
// both.

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "onboarding", label: "Onboarding", path: "/onboarding", loads: "GET /me/merchant" },
  { key: "dashboard", label: "Dashboard", path: "/dashboard", loads: "GET /me/balance" },
  {
    key: "create-payment-link",
    label: "New Payment Link",
    path: "/payment-links/new",
    loads: "POST /me/payment-links",
  },
  {
    key: "payment-link-detail",
    label: "Payment Link",
    path: "/payment-links/:linkId",
    loads: "GET /me/payment-links/{linkId}",
  },
  { key: "payment-links", label: "Payment Links", path: "/payment-links", loads: "GET /me/payment-links" },
  { key: "transactions", label: "Transactions", path: "/transactions", loads: "GET /me/transactions" },
  { key: "payouts", label: "Payouts", path: "/payouts", loads: "GET /me/payouts" },
  {
    key: "request-payout",
    label: "Request Payout",
    path: "/payouts/new",
    loads: "POST /me/payouts",
  },
  // F2 — public, no sign-in. Reachable above the guard (see App.tsx).
  {
    key: "pay-link",
    label: "Pay Link",
    path: "/pay/:linkId",
    loads: "GET /payment-links/{linkId}",
    public: true,
  },
  {
    key: "pay-mobile-money",
    label: "Pay with Mobile Money",
    path: "/pay/:linkId/mobile-money",
    loads: "POST /payment-links/{linkId}/pay",
    public: true,
  },
  {
    key: "pay-card",
    label: "Pay with Card",
    path: "/pay/:linkId/card",
    loads: "POST /payment-links/{linkId}/pay",
    public: true,
  },
  {
    key: "payment-receipt",
    label: "Payment Receipt",
    path: "/pay/:linkId/receipt",
    loads: null,
    public: true,
  },
];

for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}
