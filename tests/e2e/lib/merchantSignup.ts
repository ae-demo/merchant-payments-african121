import { type Page, expect } from "@playwright/test";

// Merchant enrolment is declared "self-service" in specs/design/security.json:
// a brand-new Merchant is expected to create their own identity through the
// platform's identity provider, then land on the Onboarding screen
// (merchant-webapp/src/pages/Onboarding.tsx) to submit KYC details. No
// Merchant test user is pre-provisioned (only PlatformAdmin is - see the
// milestone's roles gate ticket), so every Merchant-dependent criterion goes
// through this path to obtain an identity.
//
// tests/validation/test-plan.md § AC-001-a documents that this currently
// fails: the deployed identity provider offers no sign-up affordance, and
// its registration route answers "Registration not allowed". Every spec
// that needs a Merchant identity calls this helper as its first step so
// that blocker is driven for real, not assumed.
export async function beginMerchantSignUp(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForURL(/\/gate\/(signin|signup)/);
  const signUpAffordance = page
    .getByRole("button", { name: /sign up|create account|register/i })
    .or(page.getByRole("link", { name: /sign up|create account|register/i }));
  await expect(
    signUpAffordance,
    "expected a self-service sign-up affordance on the identity provider's " +
      "sign-in page (Merchant enrolment is declared self-service in " +
      "specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a",
  ).toBeVisible({ timeout: 10_000 });
  await signUpAffordance.click();
}
