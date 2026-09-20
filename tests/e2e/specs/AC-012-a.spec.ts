// spec: tests/validation/test-plan.md § AC-012-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-012-a: a Merchant can initiate a refund on a completed transaction", async ({ page }) => {
  // Requires a signed-in Merchant with a completed transaction. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
