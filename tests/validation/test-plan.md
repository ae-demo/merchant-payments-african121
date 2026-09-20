# Validation test plan — merchant-payments-african121, v1

Source of truth: `specs/validation/validation-criteria.json` (32 e2e, 4 manual, 0 scenario).

## Blocking finding (read first)

**Merchant self-service registration is disabled on the deployed identity provider.**

`specs/design/security.json` declares the `Merchant` role with
`"enrolment": "self-service"` — unlike `PlatformAdmin` (`"assignTo":
["PlatformAdmins"]`), no Merchant test user is pre-provisioned (confirmed on
the milestone's roles gate ticket #3: only `test-platform-admin` was
created). The design and the app (`merchant-webapp/src/pages/Onboarding.tsx`,
gated behind sign-in per `App.tsx`) both expect a brand-new Merchant to
create their own identity through the IdP, then land on the Onboarding
screen to submit KYC details.

Live exploration against the deployed IdP (`https://default-idp.94.72.97.95.sslip.io`)
found:
- The merchant-webapp's sign-in redirect (`/gate/signin?applicationId=...`)
  renders username/password fields and a "Sign In" button only — no sign-up
  or "create account" affordance.
- Navigating the IdP's registration route directly (`/gate/signup`) returns
  the error **"Registration request failed: Registration not allowed"**.

So there is no way — through the UI, and with no Merchant test user
provisioned — to obtain a Merchant identity in this environment. The
deployed system currently holds **zero merchants, zero payment links, zero
transactions, zero payouts and zero disputes** (confirmed via the
admin-webapp: every list — Onboarding/pending merchants, Transactions,
Payouts, Disputes — renders its empty state).

This is captured as a genuine, authored failure at **AC-001-a** (the spec
drives the real flow and fails at the missing sign-up affordance). Every
other criterion whose flow requires a Merchant identity — directly (signing
in as a Merchant) or transitively (acting on a merchant, a payment link, a
transaction, a payout, or a dispute that only a Merchant's actions can
create) — is blocked by the same root cause and is noted as such below. Each
such spec still authors and drives the real first step (attempting to
establish a Merchant identity via `tests/e2e/lib/merchantSignup.ts`) so the
failure is genuine and reproducible, not a stub.

**Platform Admin** has a working test user (`test-platform-admin`, role
`PlatformAdmin`), so every admin-only criterion that does not depend on
merchant-created data is fully exercised.

---

## AC-001-a — A new Merchant can submit business name, owner name, country, currency and contact details

- Target: merchant-webapp (primary)
- Steps:
  1. Navigate to `/` unauthenticated
  2. Follow the redirect to the IdP sign-in gate
  3. Locate a sign-up / create-account affordance
  4. Use it to register a new identity, then fill and submit the Onboarding
     form (business name, owner name, country, currency, contact email,
     contact phone)
- Assert: the sign-up affordance is visible, and after registering, the
  Onboarding form submits successfully
- Result: **genuine failure** — no sign-up affordance exists; see the
  Blocking finding above.
- Source of truth: live IdP exploration (playwright-cli) +
  `merchant-webapp/src/pages/Onboarding.tsx`, `specs/design/security.json`

## AC-001-b — After submission the merchant's KYC status is pending

- Target: merchant-webapp + payments-api
- Steps: as AC-001-a, then read back `GET /me/merchant` and assert
  `kycStatus: "pending"`
- Assert: `kycStatus` is `"pending"` immediately after registration
- Result: **blocked** — depends on AC-001-a's registration step succeeding
- Source of truth: `specs/design/components/payments-api/openapi.yaml` (`Merchant.kycStatus`)

## AC-002-a — A Platform Admin can see a list of merchants with pending KYC status

- Target: admin-webapp (primary)
- Steps:
  1. Sign in as `test-platform-admin`
  2. Open the Onboarding (pending merchants) screen
- Assert: the screen renders the "Pending merchants" list view (heading +
  table with Business/Owner/Country columns)
- Result: **passes** — the view and its capability are confirmed live; the
  environment currently holds no pending merchants (see Blocking finding),
  so only the empty-list state is observed, not a populated one
- Source of truth: live admin-webapp exploration

## AC-002-b — A Platform Admin can approve a pending merchant, setting its KYC status to approved

- Target: admin-webapp + payments-api
- Steps: sign in as admin, open Onboarding, click a pending merchant, approve it
- Assert: `kycStatus` becomes `approved`
- Result: **blocked** — no pending merchant exists to approve (root cause:
  AC-001-a)

## AC-002-c — A Platform Admin can reject a pending merchant, setting its KYC status to rejected

- Same as AC-002-b, with reject + reason instead of approve.
- Result: **blocked** — same root cause

## AC-003-a — A Merchant can create a payment link by entering an amount

- Target: merchant-webapp (`/payment-links/new`)
- Steps: sign in as Merchant, open "New Payment Link", enter an amount and
  currency, submit
- Assert: `POST /me/payment-links` succeeds (201) and the link appears with
  status `pending`
- Result: **blocked** — no Merchant identity (root cause: AC-001-a)
- Source of truth: `merchant-webapp/src/pages/CreatePaymentLink.tsx`,
  `openapi.yaml` `POST /me/payment-links`

## AC-003-b — The generated payment link includes a shareable QR code or URL

- Steps: as AC-003-a, then assert the created link's detail view shows a
  QR code image and/or a shareable URL
- Result: **blocked** — same root cause

## AC-004-a — Opening a payment link shows the amount due and a mobile money payment option

- Target: merchant-webapp public route `/pay/:linkId`
- Steps: open a real payment link's public page
- Assert: amount + a "Pay with Mobile Money" option are visible
- Result: **blocked** — no payment link exists to open (transitively: no
  Merchant identity)
- Source of truth: `merchant-webapp/src/pages/PayLink.tsx`

## AC-004-b — A Customer can complete payment via mobile money without holding a bank account or card

- Steps: from AC-004-a, choose mobile money, enter a phone number, submit
- Assert: `POST /payment-links/{linkId}/pay` (method `mobile-money`) returns
  201 and a completed/pending transaction
- Result: **blocked** — same root cause

## AC-005-a — Opening a payment link shows a card payment option

- Same target/steps as AC-004-a, asserting the card option instead
- Result: **blocked** — same root cause

## AC-005-b — A Customer can complete payment by entering card details

- Same as AC-004-b, with method `card`
- Result: **blocked** — same root cause

## AC-006-a — After a successful payment the customer sees a payment confirmation

- Target: merchant-webapp public route `/pay/:linkId/receipt`
- Steps: complete a payment (AC-004-b or AC-005-b), then land on the receipt page
- Assert: a "Payment successful" confirmation is shown
- Result: **blocked** — same root cause

## AC-007-a — A newly created payment link shows status pending

- Steps: as AC-003-a, assert the link's status badge is `pending`
- Result: **blocked** — same root cause

## AC-007-b — A payment link that has been paid shows status paid

- Steps: as AC-004-b/AC-005-b, then re-open the link (merchant or public
  view) and assert status `paid`
- Result: **blocked** — same root cause

## AC-007-c — A payment link past its validity shows status expired

- Steps: create a link with `expiresAt` in the past (or wait past
  expiry), reopen it, assert status `expired`
- Result: **blocked** — same root cause

## AC-008-a — A Merchant can view their current available balance

- Target: merchant-webapp `/dashboard`
- Steps: sign in as Merchant, open Dashboard
- Assert: `GET /me/balance` renders on the dashboard
- Result: **blocked** — same root cause
- Source of truth: `merchant-webapp/src/pages/Dashboard.tsx`

## AC-008-b — The balance increases when a payment to that merchant completes

- Steps: read balance, complete a payment (AC-004-b/AC-005-b), re-read
  balance, assert it increased by the paid amount
- Result: **blocked** — same root cause

## AC-009-a — A Merchant can view a list of their own transactions

- Target: merchant-webapp `/transactions`
- Result: **blocked** — same root cause
- Source of truth: `merchant-webapp/src/pages/Transactions.tsx`

## AC-009-b — The transaction list can be filtered by status

- Steps: as AC-009-a, apply a status filter, assert the list narrows
- Result: **blocked** — same root cause

## AC-009-c — The transaction list can be filtered by payment method

- Same as AC-009-b, filtering by method (`mobile-money`/`card`)
- Result: **blocked** — same root cause

## AC-010-a — A Merchant can request a payout specifying an amount and destination (bank or mobile wallet)

- Target: merchant-webapp `/payouts/new`
- Steps: sign in as Merchant (with a balance), request a payout
- Assert: `POST /me/payouts` succeeds (201)
- Result: **blocked** — same root cause
- Source of truth: `merchant-webapp/src/pages/RequestPayout.tsx`, `openapi.yaml`

## AC-010-b — A payout request cannot exceed the merchant's available balance

- Steps: request a payout larger than the current balance
- Assert: the request is rejected (400) / the form blocks submission
- Result: **blocked** — same root cause

## AC-011-a — A Merchant can view a list of their past payout requests with each one's status

- Target: merchant-webapp `/payouts`
- Result: **blocked** — same root cause

## AC-012-a — A Merchant can initiate a refund on a completed transaction

- Steps: sign in as Merchant, open a completed transaction, refund it
- Assert: `POST /me/transactions/{id}/refund` succeeds (201)
- Result: **blocked** — same root cause

## AC-012-b — A refund returns the full amount of the original payment to the original payment method

- Steps: as AC-012-a, assert the refund amount equals the original transaction amount
- Result: **blocked** — same root cause

## AC-013-a — A Platform Admin can view a list of transactions across all merchants

- Target: admin-webapp `/transactions`
- Steps: sign in as admin, open Transactions
- Assert: the list view renders (heading + Merchant/Amount/Method/Status/Date columns)
- Result: **passes** — view confirmed live; environment holds no
  transactions (Blocking finding), so only the empty state is observed

## AC-013-b — A Platform Admin can view a list of payouts across all merchants

- Target: admin-webapp `/payouts`
- Result: **passes** — view confirmed live, empty state (same caveat as AC-013-a)

## AC-014-a — A Platform Admin can view a list of open disputes/failed payouts

- Target: admin-webapp `/disputes`
- Result: **passes** — view confirmed live, empty state (same caveat)

## AC-014-b — A Platform Admin can mark a dispute as resolved with resolution notes

- Steps: open a dispute, add resolution notes, resolve it
- Assert: `POST /disputes/{id}/resolve` succeeds and status becomes `resolved`
- Result: **blocked** — no dispute exists (transitively: no merchant/payout
  activity ever occurred, root cause AC-001-a)

## AC-015-a — A Merchant must sign in before accessing merchant dashboard features

- Target: merchant-webapp
- Steps: navigate directly to a protected route (`/dashboard`) with no session
- Assert: the app redirects to the IdP sign-in gate instead of rendering
  dashboard content
- Result: **passes** — this only requires observing the redirect, not a
  successful Merchant login
- Source of truth: `merchant-webapp/src/App.tsx` (`SignedIn` gate)

## AC-015-b — A Platform Admin must sign in before accessing the admin portal

- Target: admin-webapp
- Steps: (1) navigate directly to a protected route with no session, assert
  redirect to sign-in; (2) sign in with `test-platform-admin`, assert the
  admin shell (Onboarding/Transactions/Payouts/Disputes rail) is reached
- Result: **passes** — fully exercised end to end with the provisioned
  admin test user

## AC-017-a — A valid payout request is not blocked awaiting manual Platform Admin approval

- Steps: request a payout as a Merchant (AC-010-a), assert its status is
  never `pending admin approval` — it transitions directly per
  `specs/design/flows/payout-request.md` (paid, or failed → dispute)
- Result: **blocked** — no Merchant identity / balance to request a payout
  from (root cause AC-001-a)

---

## Manual checklist (method: manual, not automated this run)

- AC-006-b — The confirmation clearly serves as proof the payment went through
- AC-012-c — The platform does not offer a partial refund amount option
- AC-016-a — A merchant's payment links and transactions are always
  denominated in that merchant's own currency
- AC-017-b — Only a failed payout reaches the Platform Admin for resolution

## Scenario criteria

None (0 declared).
