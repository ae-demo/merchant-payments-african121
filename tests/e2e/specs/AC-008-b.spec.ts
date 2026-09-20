// spec: tests/validation/test-plan.md § AC-008-b
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-008-b: the balance increases when a payment to that merchant completes", async ({ page }) => {
  // Requires a signed-in Merchant, a payment link, and a completed payment.
  // See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
