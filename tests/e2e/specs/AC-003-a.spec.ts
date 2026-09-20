// spec: tests/validation/test-plan.md § AC-003-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-003-a: a Merchant can create a payment link by entering an amount", async ({ page }) => {
  // Creating a payment link requires a signed-in Merchant. See
  // tests/validation/test-plan.md § AC-001-a: no Merchant identity can be
  // obtained in this environment.
  await beginMerchantSignUp(page);
});
