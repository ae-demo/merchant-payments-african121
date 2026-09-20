// Small display helpers shared by the admin pages. Amounts are minor-currency
// integers per payments-api's schemas — divide by 100 for a human amount.
export function formatMoney(amountMinor: number, currency: string): string {
  const major = amountMinor / 100;
  return `${currency} ${major.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export type StatusColor = "default" | "success" | "warning" | "error" | "info";

export function kycStatusColor(status: string): StatusColor {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    default:
      return "warning";
  }
}

export function transactionStatusColor(status: string): StatusColor {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    default:
      return "info";
  }
}

export function payoutStatusColor(status: string): StatusColor {
  switch (status) {
    case "paid":
      return "success";
    case "failed":
      return "error";
    default:
      return "info";
  }
}

export function disputeStatusColor(status: string): StatusColor {
  return status === "resolved" ? "success" : "warning";
}
