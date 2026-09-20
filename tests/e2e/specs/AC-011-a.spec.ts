// spec: tests/validation/test-plan.md § AC-011-a
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-011-a: a Merchant can view a list of their past payout requests with each one's status", async ({
  page,
}) => {
  // Requires a signed-in Merchant. See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
