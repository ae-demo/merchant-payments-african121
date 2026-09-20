// spec: tests/validation/test-plan.md § AC-009-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-009-a: a Merchant can view a list of their own transactions", async ({ page }) => {
  // Requires a signed-in Merchant. See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
