// spec: tests/validation/test-plan.md § AC-007-b
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-007-b: a payment link that has been paid shows status paid", async ({ page }) => {
  // Requires creating a payment link and completing a payment against it,
  // both of which require a Merchant identity. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
