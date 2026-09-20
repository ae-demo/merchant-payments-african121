# Merchant Payments Africa — PRD

## Problem Statement

Merchants across African countries need to accept payments from customers who
overwhelmingly pay via mobile money (e.g. MTN MoMo, M-Pesa, Airtel Money) or
card, but today they must juggle separate accounts, apps and reconciliation
processes per payment method and per country. Small and informal merchants in
particular have no simple way to request a payment, know when it has cleared,
and get the money into their own bank account or mobile wallet. This
fragmentation costs merchants sales (customers abandon payment when their
preferred method isn't supported), time (manual reconciliation across
channels), and visibility into their own cash flow.

## Solution

A merchant payments platform that lets a merchant generate a payment request
(a link or QR code) for any sale, have the customer pay it with either mobile
money or a card, and see the money land in a single running balance —
regardless of which payment method or country was used. Merchants can track
every transaction in one place and withdraw their balance to a bank account
or mobile money wallet on their own schedule. A Platform Admin oversees
merchant onboarding and the health of the whole payment network.

## Actors

- **Merchant** — a business (formal or informal) that registers on the
platform, generates payment links/QR codes for sales, views its transaction
history and balance, and requests payouts to its bank account or mobile
money wallet.
- **Customer (Payer)** — the person paying a merchant; opens a payment
link/QR code and completes payment via mobile money or card. Does not hold
an account on the platform.
- **Platform Admin** — platform-side staff who review and approve merchant
onboarding (KYC), monitor transactions and payouts across all merchants,
and handle disputes/refund escalations.

## User Stories

1. As a Merchant, I want to register an account and submit my business/KYC
 details, so that I can start accepting payments.
2. As a Platform Admin, I want to review and approve or reject a merchant's
 onboarding application, so that only verified businesses can collect
 payments on the platform.
3. As a Merchant, I want to generate a payment link or QR code for a specific
 amount, so that I can request payment for a sale.
4. As a Customer, I want to open a merchant's payment link/QR code and pay it
 using mobile money, so that I can complete a purchase without a bank
 account or card.
5. As a Customer, I want to open a merchant's payment link/QR code and pay it
 using a card, so that I can complete a purchase with the payment method I
 already carry.
6. As a Customer, I want to receive a confirmation of my payment, so that I
 have proof it went through.
7. As a Merchant, I want to see the status of a payment link/QR code (pending,
 paid, expired), so that I know whether a sale went through.
8. As a Merchant, I want to view a running balance of funds I've collected, so
 that I know how much I can withdraw.
9. As a Merchant, I want to view my full transaction history with filters (by
 date, status, payment method), so that I can reconcile my sales.
10. As a Merchant, I want to request a payout of my balance to a linked bank
 account or mobile money wallet, so that I can access my funds.
11. As a Merchant, I want to see the status and history of my payout requests,
 so that I know when to expect the money.
12. As a Merchant, I want to issue a refund to a customer for a completed
 payment, so that I can handle returns or mistaken charges.
13. As a Platform Admin, I want to view transactions and payouts across all
 merchants, so that I can monitor the health of the platform and spot
 issues.
14. As a Platform Admin, I want to review and resolve escalated disputes or
 failed payouts, so that merchants and customers get unresolved issues
 settled.

## Product Decisions

- **Sign-in**: every user (Merchant staff signing in to the web app, Platform
Admin) authenticates via SSO through Thunder, the platform IDP — an
organization default.
- **Mobile money collection**: the platform needs to collect payments via
mobile money networks (e.g. MTN MoMo, M-Pesa, Airtel Money). No mobile
money provider is registered as an organization resource yet and the user
has not named one they already hold a contract with, so the concrete
provider(s) are chosen at design time, per country, from what the design
agent proposes.
- **Card collection**: the platform needs to collect card payments (Visa/
Mastercard). No card-processing provider is registered as an organization
resource yet and the user has not named one, so the concrete processor is
chosen at design time.
- **Payout destinations**: a merchant's payout can go to a linked bank account
or a mobile money wallet — the same underlying provider integrations used
for collection may serve payouts; confirmed at design time.
- **Multi-country / multi-currency**: the platform operates across multiple
African countries and each merchant transacts in the currency of its own
country; no cross-country/cross-currency conversion is offered. *assumed*
- **Payout approval**: a payout request is queued and processed automatically
once the merchant's balance and linked payout destination are verified — no
manual Platform Admin approval is required on the happy path (only
escalated/failed payouts reach an admin, per story 14). *assumed*
- **Refunds**: a Merchant can refund a completed payment in full, back to the
original payment method, within a limited window after payment; the
platform does not support partial refunds in this scope. *assumed*
- **Notifications**: customers receive payment confirmations and merchants
receive payment/payout status updates via SMS and email. *assumed*
- **KYC depth**: merchant onboarding collects standard business-identity
information (business name, owner identity document, country, contact
details) rather than deep financial/compliance documentation; the
Platform Admin reviews and approves/rejects based on this. *assumed*

## Out of Scope

- Embeddable e-commerce checkout / API for merchants' own websites or apps
(this platform serves payment links/QR codes only).
- Physical point-of-sale (POS) hardware or card-present in-person tap
payments.
- Currency conversion or cross-border settlement.
- Lending, credit, or working-capital advances against merchant balances.
- Sub-merchant / reseller hierarchies (a merchant staff role with restricted
permissions under one merchant account is not modeled).
- Automated fraud/dispute chargeback processing beyond the manual escalation
path in story 14.

## Open Questions

1. Which specific mobile money networks and card processor(s), and in which
 countries, must the platform support at launch? Left open pending a
 concrete provider decision at design time.

## Further Notes

None.