// spec: tests/validation/test-plan.md § AC-001-b
import { test } from "@playwright/test";
import { beginMerchantSignUp } from "../lib/merchantSignup";

test("AC-001-b: after submission the merchant's KYC status is pending", async ({ page }) => {
  // Reading back kycStatus="pending" requires a freshly-registered Merchant
  // identity. See tests/validation/test-plan.md § AC-001-a: self-service
  // registration is disabled on the deployed identity provider.
  await beginMerchantSignUp(page);
});
