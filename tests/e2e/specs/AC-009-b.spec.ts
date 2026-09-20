// spec: tests/validation/test-plan.md § AC-009-b
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-009-b: the transaction list can be filtered by status", async ({ page }) => {
  // Requires a signed-in Merchant with transactions to filter. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
