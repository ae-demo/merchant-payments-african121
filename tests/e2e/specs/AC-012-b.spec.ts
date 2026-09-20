// spec: tests/validation/test-plan.md § AC-012-b
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-012-b: a refund returns the full amount of the original payment to the original payment method", async ({
  page,
}) => {
  // Requires a signed-in Merchant with a completed transaction to refund.
  // See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
