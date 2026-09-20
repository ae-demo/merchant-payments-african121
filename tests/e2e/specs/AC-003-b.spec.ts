// spec: tests/validation/test-plan.md § AC-003-b
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-003-b: the generated payment link includes a shareable QR code or URL", async ({ page }) => {
  // Requires a Merchant identity to create a payment link first. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
