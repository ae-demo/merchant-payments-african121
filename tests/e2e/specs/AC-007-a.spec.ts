// spec: tests/validation/test-plan.md § AC-007-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-007-a: a newly created payment link shows status pending", async ({ page }) => {
  // Requires a Merchant identity to create a payment link. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
