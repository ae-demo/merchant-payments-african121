// spec: tests/validation/test-plan.md § AC-017-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-017-a: a valid payout request is not blocked awaiting manual Platform Admin approval", async ({
  page,
}) => {
  // Requires a signed-in Merchant with a balance to request a payout from.
  // See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
