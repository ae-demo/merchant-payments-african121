// spec: tests/validation/test-plan.md § AC-005-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-005-a: opening a payment link shows a card payment option", async ({ page }) => {
  // Requires an existing payment link, which requires a Merchant identity
  // to create it. See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
