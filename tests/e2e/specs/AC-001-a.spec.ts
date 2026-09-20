// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";

test("AC-001-a: a new Merchant can submit business/owner/country/currency/contact details", async ({ page }) => {
  // 1. Navigate to merchant-webapp unauthenticated
  await page.goto("/");
  // 2. It redirects to the identity provider's sign-in gate
  await page.waitForURL(/\/gate\/(signin|signup)/);
  // 3. A brand-new Merchant needs a way to create their own identity here -
  //    Merchant enrolment is declared "self-service" in
  //    specs/design/security.json, and no Merchant test user is
  //    pre-provisioned (unlike PlatformAdmin).
  const signUpAffordance = page
    .getByRole("button", { name: /sign up|create account|register/i })
    .or(page.getByRole("link", { name: /sign up|create account|register/i }));
  await expect(
    signUpAffordance,
    "no self-service sign-up affordance is offered on the identity " +
      "provider's sign-in page, so a new Merchant has no way to create an " +
      "account and reach the Onboarding form to submit business/KYC details",
  ).toBeVisible({ timeout: 10_000 });

  // The rest of the flow (fill business name, owner name, country, currency,
  // contact email/phone on the Onboarding form and submit) cannot be reached
  // without a Merchant identity - see tests/validation/test-plan.md § AC-001-a.
});
