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

// Adapted from thunder-authentication's assets/screens.example.ts for
// admin-webapp. This is the ONLY file that knows about screens; each one
// names the operation it LOADS, from specs/design/components/admin-webapp/
// wireframes.dsl's F1 "Platform admin oversight" flow (Platform Admin only —
// all screens sit behind the sign-in guard), in rail/walk order.
//
// DisputeDetail has no dedicated per-id GET in payments-api's openapi.yaml —
// only GET /disputes (list) and POST /disputes/{disputeId}/resolve — so it
// loads the same list operation as Disputes and finds its record by id,
// exactly as `wireframes/references/implementing.md` says to join a missing
// column from one bulk list request rather than inventing an endpoint.

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
  { key: "onboarding", label: "Onboarding Queue", path: "/onboarding", loads: "GET /merchants" },
  { key: "merchant-review", label: "Merchant Review", path: "/onboarding/:merchantId", loads: "GET /merchants/{merchantId}" },
  { key: "transactions", label: "All Transactions", path: "/transactions", loads: "GET /transactions" },
  { key: "payouts", label: "All Payouts", path: "/payouts", loads: "GET /payouts" },
  { key: "disputes", label: "Disputes", path: "/disputes", loads: "GET /disputes" },
  { key: "dispute-detail", label: "Dispute Detail", path: "/disputes/:disputeId", loads: "GET /disputes" },
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

/** The sidebar's own items — the wireframe's `sidebar` line, drill-down screens excluded. */
export const NAV_SCREEN_KEYS: readonly string[] = ["onboarding", "transactions", "payouts", "disputes"];
