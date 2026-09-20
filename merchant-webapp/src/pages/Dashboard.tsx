// wireframes.dsl: screen Dashboard — stat cards (balance, pending payments),
// KYC badge, "New payment link" / "Request payout" actions, recent
// transactions table -> Transactions.
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  ListingTable,
  PageContent,
  PageTitle,
  Typography,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";
import { formatDateTime, formatMethod, formatMoney, statusColor, titleCase } from "../format";

type Transaction = components["schemas"]["Transaction"];
type KycStatus = components["schemas"]["Merchant"]["kycStatus"];

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void Promise.all([
      paymentsApi.GET("/me/balance"),
      paymentsApi.GET("/me/transactions", { params: { query: { status: "pending", limit: 1 } } }),
      paymentsApi.GET("/me/transactions", { params: { query: { limit: 5 } } }),
      paymentsApi.GET("/me/merchant"),
    ]).then(([balanceRes, pendingRes, recentRes, merchantRes]) => {
      if (!live) return;
      if (balanceRes.data) setBalance({ amount: balanceRes.data.amount, currency: balanceRes.data.currency });
      if (pendingRes.data) setPendingCount(pendingRes.data.count);
      if (recentRes.data) setRecent(recentRes.data.data);
      if (merchantRes.data) setKycStatus(merchantRes.data.kycStatus);
    }).finally(() => {
      if (live) setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Dashboard</PageTitle.Header>
        <PageTitle.Actions>
          <Button variant="outlined" onClick={() => navigate("/payouts/new")}>
            Request payout
          </Button>
          <Button variant="contained" onClick={() => navigate("/payment-links/new")}>
            New payment link
          </Button>
        </PageTitle.Actions>
      </PageTitle>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Available balance
              </Typography>
              <Typography variant="h4">
                {loading ? "…" : balance ? formatMoney(balance.amount, balance.currency) : "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ready to withdraw
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Pending payments
              </Typography>
              <Typography variant="h4">{loading ? "…" : (pendingCount ?? 0)}</Typography>
              <Typography variant="caption" color="text.secondary">
                awaiting confirmation
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {kycStatus ? (
              <Chip
                label={`KYC: ${titleCase(kycStatus)}`}
                color={statusColor(kycStatus)}
                size="small"
              />
            ) : loading ? null : (
              <Chip label="KYC: Not submitted" size="small" />
            )}
          </Box>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent transactions
      </Typography>
      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Date</ListingTable.Cell>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Method</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {recent.length === 0 && !loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={4}>
                  <ListingTable.EmptyState title="No transactions yet" />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              recent.map((t) => (
                <ListingTable.Row key={t.id} clickable onClick={() => navigate("/transactions")}>
                  <ListingTable.Cell>{formatDateTime(t.createdAt)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMoney(t.amount, t.currency)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMethod(t.method)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={titleCase(t.status)} color={statusColor(t.status)} size="small" />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>
    </PageContent>
  );
}
