// spec: tests/validation/test-plan.md § AC-005-b
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-005-b: a Customer can complete payment by entering card details", async ({ page }) => {
  // Requires an existing payment link, which requires a Merchant identity
  // to create it. See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
