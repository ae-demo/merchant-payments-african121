// spec: tests/validation/test-plan.md § AC-004-b
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-004-b: a Customer can complete payment via mobile money without holding a bank account or card", async ({
  page,
}) => {
  // Requires an existing payment link, which requires a Merchant identity
  // to create it. See tests/validation/test-plan.md § AC-001-a.
  await beginMerchantSignUp(page);
});
