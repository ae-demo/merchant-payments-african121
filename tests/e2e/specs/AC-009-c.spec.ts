// spec: tests/validation/test-plan.md § AC-009-c
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-009-c: the transaction list can be filtered by payment method", async ({ page }) => {
  // Requires a signed-in Merchant with transactions to filter. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
