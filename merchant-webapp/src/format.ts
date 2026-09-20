// Small display helpers shared by every page, so a currency string or a
// status label is spelled the same way everywhere the wireframe draws it
// (e.g. "KES 2,000", "Mobile Money", "Completed").
export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatMethod(method: string): string {
  return method === "mobile-money" ? "Mobile Money" : "Card";
}

export function formatDestinationType(destinationType: string): string {
  return destinationType === "bank" ? "Bank" : "Mobile Wallet";
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function statusColor(status: string): "success" | "warning" | "error" | "default" {
  switch (status) {
    case "completed":
    case "paid":
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "failed":
    case "rejected":
    case "expired":
      return "error";
    default:
      return "default";
  }
}
