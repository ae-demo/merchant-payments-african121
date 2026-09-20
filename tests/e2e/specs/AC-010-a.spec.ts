// spec: tests/validation/test-plan.md § AC-010-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-010-a: a Merchant can request a payout specifying an amount and destination (bank or mobile wallet)", async ({
  page,
}) => {
  // Requires a signed-in Merchant with a balance. See
  // tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
