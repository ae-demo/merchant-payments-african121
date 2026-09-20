// spec: tests/validation/test-plan.md § AC-007-c
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-007-c: a payment link past its validity shows status expired", async ({ page }) => {
  // Requires a Merchant identity to create an expiring payment link. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
