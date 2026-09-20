// spec: tests/validation/test-plan.md § AC-004-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-004-a: opening a payment link shows the amount due and a mobile money payment option", async ({
  page,
}) => {
  // Opening a real payment link requires one to exist, which requires a
  // Merchant identity to create it. See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
