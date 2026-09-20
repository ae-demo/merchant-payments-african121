screen OnboardingQueue "Merchants pending KYC review"
  navbar "Payments Admin"
  sidebar "Onboarding -> OnboardingQueue | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Pending merchants"
  table "Business | Owner | Country | Submitted" -> MerchantReview
    row "Acme Traders | Jane Doe | Kenya | Today"
    row "Kampala Foods | John K. | Uganda | Yesterday"

screen MerchantReview "Review one merchant's KYC details and approve or reject"
  navbar "Payments Admin"
  sidebar "Onboarding -> OnboardingQueue | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Acme Traders"
  text "Owner: Jane Doe"
  text "Country: Kenya"
  text "Contact: jane@acme.example"
  badge "Pending" warning
  row
    button "Reject" danger -> OnboardingQueue
    right
    button "Approve" primary -> OnboardingQueue

screen AllTransactions "Every transaction across all merchants"
  navbar "Payments Admin"
  sidebar "Onboarding -> OnboardingQueue | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Transactions"
  row
    select "Merchant"
    search "Search"
  table "Merchant | Amount | Method | Status | Date"
    row "Acme Traders | KES 2,000 | Mobile Money | Completed | Today"
    row "Kampala Foods | UGX 40,000 | Card | Completed | Today"

screen AllPayouts "Every payout across all merchants"
  navbar "Payments Admin"
  sidebar "Onboarding -> OnboardingQueue | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Payouts"
  table "Merchant | Amount | Destination | Status" -> Disputes
    row "Acme Traders | KES 50,000 | Bank ****1234 | Paid"
    row "Kampala Foods | UGX 100,000 | Mobile Wallet | Failed"

screen Disputes "Escalated disputes and failed payouts awaiting resolution"
  navbar "Payments Admin"
  sidebar "Onboarding -> OnboardingQueue | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Open disputes"
  table "Merchant | Subject | Status" -> DisputeDetail
    row "Kampala Foods | Failed payout to mobile wallet | Open"

screen DisputeDetail "Resolve one escalated dispute"
  navbar "Payments Admin"
  sidebar "Onboarding -> OnboardingQueue | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Failed payout to mobile wallet"
  text "Merchant: Kampala Foods"
  text "Amount: UGX 100,000"
  textarea "Resolution notes"
  button "Mark resolved" primary -> Disputes

flow "Platform admin oversight"
  role "Platform Admin"
  description "An admin reviews merchant onboarding, monitors activity, and resolves disputes"
  OnboardingQueue
  MerchantReview
  AllTransactions
  AllPayouts
  Disputes
  DisputeDetail
