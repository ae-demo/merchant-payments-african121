# Validation report

- **Issue:** #8
- **Commit:** ebda40988ccd7bea640cfe1c6867ffcfd5d3d68d
- **Generated:** 2026-09-20T05:37:51.348Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 32 | 6 | 26 | 0 |
| manual (human checklist) | 4 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | A new Merchant can submit business name, owner name, country, currency and contact details | ❌ fail | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | After submission the merchant's KYC status is pending | ❌ fail | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-002-a | A Platform Admin can see a list of merchants with pending KYC status | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A Platform Admin can approve a pending merchant, setting its KYC status to approved | ❌ fail | `tests/e2e/specs/AC-002-b.spec.ts` | healed ×1 |
| AC-002-c | A Platform Admin can reject a pending merchant, setting its KYC status to rejected | ❌ fail | `tests/e2e/specs/AC-002-c.spec.ts` | healed ×1 |
| AC-003-a | A Merchant can create a payment link by entering an amount | ❌ fail | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-003-b | The generated payment link includes a shareable QR code or URL | ❌ fail | `tests/e2e/specs/AC-003-b.spec.ts` | — |
| AC-004-a | Opening a payment link shows the amount due and a mobile money payment option | ❌ fail | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | A Customer can complete payment via mobile money without holding a bank account or card | ❌ fail | `tests/e2e/specs/AC-004-b.spec.ts` | — |
| AC-005-a | Opening a payment link shows a card payment option | ❌ fail | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-005-b | A Customer can complete payment by entering card details | ❌ fail | `tests/e2e/specs/AC-005-b.spec.ts` | — |
| AC-006-a | After a successful payment the customer sees a payment confirmation | ❌ fail | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-007-a | A newly created payment link shows status pending | ❌ fail | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | A payment link that has been paid shows status paid | ❌ fail | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-007-c | A payment link past its validity shows status expired | ❌ fail | `tests/e2e/specs/AC-007-c.spec.ts` | — |
| AC-008-a | A Merchant can view their current available balance | ❌ fail | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-008-b | The balance increases when a payment to that merchant completes | ❌ fail | `tests/e2e/specs/AC-008-b.spec.ts` | — |
| AC-009-a | A Merchant can view a list of their own transactions | ❌ fail | `tests/e2e/specs/AC-009-a.spec.ts` | — |
| AC-009-b | The transaction list can be filtered by status | ❌ fail | `tests/e2e/specs/AC-009-b.spec.ts` | — |
| AC-009-c | The transaction list can be filtered by payment method | ❌ fail | `tests/e2e/specs/AC-009-c.spec.ts` | — |
| AC-010-a | A Merchant can request a payout specifying an amount and destination (bank or mobile wallet) | ❌ fail | `tests/e2e/specs/AC-010-a.spec.ts` | — |
| AC-010-b | A payout request cannot exceed the merchant's available balance | ❌ fail | `tests/e2e/specs/AC-010-b.spec.ts` | — |
| AC-011-a | A Merchant can view a list of their past payout requests with each one's status | ❌ fail | `tests/e2e/specs/AC-011-a.spec.ts` | — |
| AC-012-a | A Merchant can initiate a refund on a completed transaction | ❌ fail | `tests/e2e/specs/AC-012-a.spec.ts` | — |
| AC-012-b | A refund returns the full amount of the original payment to the original payment method | ❌ fail | `tests/e2e/specs/AC-012-b.spec.ts` | — |
| AC-013-a | A Platform Admin can view a list of transactions across all merchants | ✅ pass | `tests/e2e/specs/AC-013-a.spec.ts` | healed ×1 |
| AC-013-b | A Platform Admin can view a list of payouts across all merchants | ✅ pass | `tests/e2e/specs/AC-013-b.spec.ts` | healed ×1 |
| AC-014-a | A Platform Admin can view a list of open disputes/failed payouts | ✅ pass | `tests/e2e/specs/AC-014-a.spec.ts` | healed ×1 |
| AC-014-b | A Platform Admin can mark a dispute as resolved with resolution notes | ❌ fail | `tests/e2e/specs/AC-014-b.spec.ts` | healed ×1 |
| AC-015-a | A Merchant must sign in before accessing merchant dashboard features | ✅ pass | `tests/e2e/specs/AC-015-a.spec.ts` | — |
| AC-015-b | A Platform Admin must sign in before accessing the admin portal | ✅ pass | `tests/e2e/specs/AC-015-b.spec.ts` | — |
| AC-017-a | A valid payout request is not blocked awaiting manual Platform Admin approval | ❌ fail | `tests/e2e/specs/AC-017-a.spec.ts` | — |

## Failures

### AC-001-a — A new Merchant can submit business name, owner name, country, currency and contact details

Spec: `tests/e2e/specs/AC-001-a.spec.ts`
Location: `AC-001-a.spec.ts:4`

```
Error: no self-service sign-up affordance is offered on the identity provider's sign-in page, so a new Merchant has no way to create an account and reach the Onboarding form to submit business/KYC details

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - no self-service sign-up affordance is offered on the identity provider's sign-in page, so a new Merchant has no way to create an account and reach the Onboarding form to submit business/KYC details with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-001-b — After submission the merchant's KYC status is pending

Spec: `tests/e2e/specs/AC-001-b.spec.ts`
Location: `AC-001-b.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-002-b — A Platform Admin can approve a pending merchant, setting its KYC status to approved

Spec: `tests/e2e/specs/AC-002-b.spec.ts`
Location: `AC-002-b.spec.ts:6`

```
Error: expected at least one pending merchant row to approve, but the pending merchants list is empty - no Merchant has ever registered

expect(locator).not.toHaveCount(expected) failed

Locator:  getByRole('row').filter({ has: getByRole('cell') })
Expected: not 0
Received: 0
Timeout:  10000ms

Call log:
  - expected at least one pending merchant row to approve, but the pending merchants list is empty - no Merchant has ever registered with timeout 10000ms
  - waiting for getByRole('row').filter({ has: getByRole('cell') })
    24 × locator resolved to 0 elements
       - unexpected value "0"

```

### AC-002-c — A Platform Admin can reject a pending merchant, setting its KYC status to rejected

Spec: `tests/e2e/specs/AC-002-c.spec.ts`
Location: `AC-002-c.spec.ts:6`

```
Error: expected at least one pending merchant row to reject, but the pending merchants list is empty - no Merchant has ever registered

expect(locator).not.toHaveCount(expected) failed

Locator:  getByRole('row').filter({ has: getByRole('cell') })
Expected: not 0
Received: 0
Timeout:  10000ms

Call log:
  - expected at least one pending merchant row to reject, but the pending merchants list is empty - no Merchant has ever registered with timeout 10000ms
  - waiting for getByRole('row').filter({ has: getByRole('cell') })
    24 × locator resolved to 0 elements
       - unexpected value "0"

```

### AC-003-a — A Merchant can create a payment link by entering an amount

Spec: `tests/e2e/specs/AC-003-a.spec.ts`
Location: `AC-003-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-003-b — The generated payment link includes a shareable QR code or URL

Spec: `tests/e2e/specs/AC-003-b.spec.ts`
Location: `AC-003-b.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-004-a — Opening a payment link shows the amount due and a mobile money payment option

Spec: `tests/e2e/specs/AC-004-a.spec.ts`
Location: `AC-004-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-004-b — A Customer can complete payment via mobile money without holding a bank account or card

Spec: `tests/e2e/specs/AC-004-b.spec.ts`
Location: `AC-004-b.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-005-a — Opening a payment link shows a card payment option

Spec: `tests/e2e/specs/AC-005-a.spec.ts`
Location: `AC-005-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-005-b — A Customer can complete payment by entering card details

Spec: `tests/e2e/specs/AC-005-b.spec.ts`
Location: `AC-005-b.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-006-a — After a successful payment the customer sees a payment confirmation

Spec: `tests/e2e/specs/AC-006-a.spec.ts`
Location: `AC-006-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-007-a — A newly created payment link shows status pending

Spec: `tests/e2e/specs/AC-007-a.spec.ts`
Location: `AC-007-a.spec.ts:5`

```
Test timeout of 30000ms exceeded.
```

### AC-007-b — A payment link that has been paid shows status paid

Spec: `tests/e2e/specs/AC-007-b.spec.ts`
Location: `AC-007-b.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-007-c — A payment link past its validity shows status expired

Spec: `tests/e2e/specs/AC-007-c.spec.ts`
Location: `AC-007-c.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-008-a — A Merchant can view their current available balance

Spec: `tests/e2e/specs/AC-008-a.spec.ts`
Location: `AC-008-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-008-b — The balance increases when a payment to that merchant completes

Spec: `tests/e2e/specs/AC-008-b.spec.ts`
Location: `AC-008-b.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-009-a — A Merchant can view a list of their own transactions

Spec: `tests/e2e/specs/AC-009-a.spec.ts`
Location: `AC-009-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-009-b — The transaction list can be filtered by status

Spec: `tests/e2e/specs/AC-009-b.spec.ts`
Location: `AC-009-b.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-009-c — The transaction list can be filtered by payment method

Spec: `tests/e2e/specs/AC-009-c.spec.ts`
Location: `AC-009-c.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-010-a — A Merchant can request a payout specifying an amount and destination (bank or mobile wallet)

Spec: `tests/e2e/specs/AC-010-a.spec.ts`
Location: `AC-010-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-010-b — A payout request cannot exceed the merchant's available balance

Spec: `tests/e2e/specs/AC-010-b.spec.ts`
Location: `AC-010-b.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-011-a — A Merchant can view a list of their past payout requests with each one's status

Spec: `tests/e2e/specs/AC-011-a.spec.ts`
Location: `AC-011-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-012-a — A Merchant can initiate a refund on a completed transaction

Spec: `tests/e2e/specs/AC-012-a.spec.ts`
Location: `AC-012-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-012-b — A refund returns the full amount of the original payment to the original payment method

Spec: `tests/e2e/specs/AC-012-b.spec.ts`
Location: `AC-012-b.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

### AC-014-b — A Platform Admin can mark a dispute as resolved with resolution notes

Spec: `tests/e2e/specs/AC-014-b.spec.ts`
Location: `AC-014-b.spec.ts:6`

```
Error: expected at least one open dispute row to resolve, but the disputes list is empty - no merchant/payout activity has ever occurred

expect(locator).not.toHaveCount(expected) failed

Locator:  getByRole('row').filter({ has: getByRole('cell') })
Expected: not 0
Received: 0
Timeout:  10000ms

Call log:
  - expected at least one open dispute row to resolve, but the disputes list is empty - no merchant/payout activity has ever occurred with timeout 10000ms
  - waiting for getByRole('row').filter({ has: getByRole('cell') })
    24 × locator resolved to 0 elements
       - unexpected value "0"

```

### AC-017-a — A valid payout request is not blocked awaiting manual Platform Admin approval

Spec: `tests/e2e/specs/AC-017-a.spec.ts`
Location: `AC-017-a.spec.ts:5`

```
Error: expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - expected a self-service sign-up affordance on the identity provider's sign-in page (Merchant enrolment is declared self-service in specs/design/security.json) — see tests/validation/test-plan.md § AC-001-a with timeout 10000ms
  - waiting for getByRole('button', { name: /sign up|create account|register/i }).or(getByRole('link', { name: /sign up|create account|register/i }))

```

## Manual checklist

- [ ] **AC-006-b** — The confirmation clearly serves as proof the payment went through
- [ ] **AC-012-c** — The platform does not offer a partial refund amount option
- [ ] **AC-016-a** — A merchant's payment links and transactions are always denominated in that merchant's own currency
- [ ] **AC-017-b** — Only a failed payout reaches the Platform Admin for resolution

## Healing log

| Criterion | Classification | Change | Commit |
|---|---|---|---|
| AC-013-a | timing / navigation | sign-in always lands on the default landing screen (Onboarding), not the originally requested deep link - navigate to /transactions again after login instead of relying on redirect preservation | `pending` |
| AC-013-b | timing / navigation | same as AC-013-a, for /payouts | `pending` |
| AC-014-a | timing / navigation | same as AC-013-a, for /disputes | `pending` |
| AC-002-b | locator drift | getByRole('row').filter({ hasNotText: 'Business Owner Country' }) accidentally matched the header row (its actual text content has no spaces between column names, so the hasNotText substring check never excluded it) giving a false positive count of 1 -> locator('table tbody tr') with not.toHaveCount(0), targeting body rows directly | `pending` |
| AC-002-c | locator drift | same fix as AC-002-b | `pending` |
| AC-014-b | locator drift | same fix as AC-002-b, for the disputes table | `pending` |

