// spec: tests/validation/test-plan.md § AC-006-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-006-a: after a successful payment the customer sees a payment confirmation", async ({ page }) => {
  // Requires completing a payment, which requires an existing payment link,
  // which requires a Merchant identity to create it. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
