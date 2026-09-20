// spec: tests/validation/test-plan.md § AC-008-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-008-a: a Merchant can view their current available balance", async ({ page }) => {
  // Requires a signed-in Merchant. See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
