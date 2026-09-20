screen Onboarding "Sign up your business and submit KYC details"
  heading "Register your business"
  input "Business name"
  input "Owner full name"
  select "Country"
  select "Currency"
  input "Contact email"
  input "Contact phone"
  button "Submit for review" primary -> Dashboard

screen Dashboard "Merchant home: balance, quick actions and recent activity"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment Links -> PaymentLinks | Transactions -> Transactions | Payouts -> Payouts"
  row
    card "Available balance | KES 128,400 | ready to withdraw"
    card "Pending payments | 3 | awaiting confirmation"
    badge "KYC: Approved" success
  row
    button "New payment link" primary -> CreatePaymentLink
    right
    button "Request payout" -> RequestPayout
  heading "Recent transactions"
  table "Date | Amount | Method | Status" -> Transactions
    row "Today 10:04 | KES 2,000 | Mobile Money | Completed"
    row "Today 09:41 | KES 8,500 | Card | Completed"

screen CreatePaymentLink "Generate a payment link/QR code for a sale"
  heading "New payment link"
  input "Amount"
  select "Currency"
  row
    button "Cancel" -> Dashboard
    right
    button "Generate link" primary -> PaymentLinkDetail

screen PaymentLinkDetail "A generated payment link, ready to share"
  heading "Payment link ready"
  image "QR code" 200x200
  text "https://pay.example/l/8f3ac2"
  badge "Pending" warning
  button "Back to dashboard" -> Dashboard

screen PaymentLinks "All payment links this merchant has generated"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment Links -> PaymentLinks | Transactions -> Transactions | Payouts -> Payouts"
  row
    heading "Payment links"
    right
    button "New payment link" primary -> CreatePaymentLink
  table "Created | Amount | Status" -> PaymentLinkDetail
    row "Today 10:00 | KES 2,000 | Paid"
    row "Yesterday | KES 1,200 | Expired"

screen Transactions "Full transaction history with filters"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment Links -> PaymentLinks | Transactions -> Transactions | Payouts -> Payouts"
  heading "Transactions"
  row
    select "Status"
    select "Method"
    search "Search"
  table "Date | Amount | Method | Status | Action"
    row "Today 10:04 | KES 2,000 | Mobile Money | Completed | Refund"
    row "Today 09:41 | KES 8,500 | Card | Completed | Refund"

screen Payouts "Payout requests and their status/history"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment Links -> PaymentLinks | Transactions -> Transactions | Payouts -> Payouts"
  row
    heading "Payouts"
    right
    button "Request payout" primary -> RequestPayout
  table "Requested | Amount | Destination | Status"
    row "Today | KES 50,000 | Bank ****1234 | Paid"
    row "Last week | KES 20,000 | M-Pesa | Failed"

screen RequestPayout "Withdraw balance to a bank account or mobile wallet"
  heading "Request payout"
  text "Available balance: KES 128,400"
  input "Amount"
  select "Destination type (Bank / Mobile Wallet)"
  input "Account / wallet number"
  row
    button "Cancel" -> Payouts
    right
    button "Submit request" primary -> Payouts

screen PayLink "Public checkout page a customer opens from a payment link"
  heading "Pay Acme Traders"
  text "Amount due: KES 2,000"
  row
    button "Pay with Mobile Money" primary -> PayMobileMoney
    button "Pay with Card" -> PayCard

screen PayMobileMoney "Customer pays via mobile money"
  heading "Pay with Mobile Money"
  input "Mobile number"
  button "Confirm payment" primary -> PaymentReceipt

screen PayCard "Customer pays via card"
  heading "Pay with Card"
  input "Card number"
  input "Expiry"
  input "CVV"
  button "Confirm payment" primary -> PaymentReceipt

screen PaymentReceipt "Confirmation the customer's payment went through"
  heading "Payment successful"
  badge "Completed" success
  text "KES 2,000 paid to Acme Traders"
  text "A receipt has been sent to you by SMS/email."

flow "Merchant onboarding and daily operations"
  role "Merchant"
  description "A merchant signs up, generates payment links, tracks activity and withdraws its balance"
  Onboarding
  Dashboard
  CreatePaymentLink
  PaymentLinkDetail
  PaymentLinks
  Transactions
  Payouts
  RequestPayout

flow "Customer checkout"
  description "A customer opens a merchant's payment link and pays via mobile money or card"
  PayLink
  PayMobileMoney
  PayCard
  PaymentReceipt
