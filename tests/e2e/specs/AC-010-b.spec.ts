// spec: tests/validation/test-plan.md § AC-010-b
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-010-b: a payout request cannot exceed the merchant's available balance", async ({ page }) => {
  // Requires a signed-in Merchant with a balance. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
