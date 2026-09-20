// wireframes.dsl: screen PaymentReceipt (F2, public) — "Payment successful"
// heading, "Completed" badge, amount + merchant text, SMS/email note.
//
// loads: null — this screen needs no API call of its own; it renders the
// Transaction the previous screen's POST already returned, carried on
// navigation state. Direct navigation with no state (a bookmarked/typed URL)
// has nothing to show, so it sends the visitor back to the pay link instead
// of rendering a blank success page.
import { type JSX } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { Box, Chip, PageContent, PageTitle, Typography } from "@wso2/oxygen-ui";
import type { components } from "../generated/payments-api";
import { formatMoney, titleCase } from "../format";

type Transaction = components["schemas"]["Transaction"];

export function PaymentReceiptPage(): JSX.Element {
  const { linkId } = useParams<{ linkId: string }>();
  const location = useLocation();
  const state = location.state as { transaction?: Transaction; merchantName?: string } | null;
  const transaction = state?.transaction;
  const merchantName = state?.merchantName;

  if (!transaction) {
    return <Navigate to={`/pay/${linkId}`} replace />;
  }

  const succeeded = transaction.status === "completed";

  return (
    <PageContent maxWidth={480}>
      <PageTitle>
        <PageTitle.Header>{succeeded ? "Payment successful" : "Payment status"}</PageTitle.Header>
      </PageTitle>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
        <Chip
          label={titleCase(transaction.status)}
          color={succeeded ? "success" : transaction.status === "pending" ? "warning" : "error"}
        />
        <Typography>
          {formatMoney(transaction.amount, transaction.currency)} paid
          {merchantName ? ` to ${merchantName}` : ""}
        </Typography>
        {succeeded ? (
          <Typography color="text.secondary">A receipt has been sent to you by SMS/email.</Typography>
        ) : (
          <Typography color="text.secondary">
            Your payment did not complete. Please try again from the payment link.
          </Typography>
        )}
      </Box>
    </PageContent>
  );
}
