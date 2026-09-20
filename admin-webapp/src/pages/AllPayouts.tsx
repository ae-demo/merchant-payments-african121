// wireframes.dsl: screen AllPayouts "Every payout across all merchants" —
// table "Merchant | Amount | Destination | Status" -> Disputes (the arrow is
// drawn on the TABLE, not a specific row's dispute — every row leads to the
// Disputes screen, exactly as the DSL draws it).
//
// GAPS:
//  - Merchant column: Payout carries merchantId only, joined here from one
//    bulk GET /merchants request (admin holds merchants:read-all).
//  - Destination column: payments-api's Payout schema returns
//    `destinationType` (bank | mobile-wallet) but never the masked account
//    number the wireframe's sample row shows ("Bank ****1234") — that value
//    only exists on PayoutInput, which the API never echoes back. Shown as
//    the destination type instead.
import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageContent,
  PageTitle,
  ListingTable,
  Chip,
  CircularProgress,
  Box,
  Alert,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { formatMoney, payoutStatusColor, titleCase } from "../lib/format";
import type { components } from "../generated/payments-api";

type Payout = components["schemas"]["Payout"];
type Merchant = components["schemas"]["Merchant"];

const DESTINATION_LABEL: Record<string, string> = {
  bank: "Bank",
  "mobile-wallet": "Mobile Wallet",
};

export default function AllPayoutsPage(): JSX.Element {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    paymentsApi.GET("/merchants", { params: { query: { limit: 100 } } }).then(({ data, error: apiError }) => {
      if (!live || apiError) return;
      setMerchants(data?.data ?? []);
    });
    paymentsApi
      .GET("/payouts", { params: { query: { limit: 100 } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError("Could not load payouts.");
          return;
        }
        setPayouts(data?.data ?? []);
      })
      .catch(() => live && setError("Could not load payouts."));
    return () => {
      live = false;
    };
  }, []);

  const merchantName = useMemo(() => {
    const byId = new Map((merchants ?? []).map((m) => [m.id, m.businessName]));
    return (id: string) => byId.get(id) ?? id;
  }, [merchants]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payouts</PageTitle.Header>
        <PageTitle.SubHeader>Every payout across all merchants</PageTitle.SubHeader>
      </PageTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!payouts && !error && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {payouts && (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Merchant</ListingTable.Cell>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Destination</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {payouts.map((p) => (
                <ListingTable.Row key={p.id} clickable onClick={() => navigate("/disputes")}>
                  <ListingTable.Cell>{merchantName(p.merchantId)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMoney(p.amount, p.currency)}</ListingTable.Cell>
                  <ListingTable.Cell>{DESTINATION_LABEL[p.destinationType] ?? p.destinationType}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={titleCase(p.status)} color={payoutStatusColor(p.status)} size="small" />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {payouts.length === 0 && (
            <ListingTable.EmptyState title="No payouts" description="No payouts have been recorded yet." />
          )}
        </ListingTable.Container>
      )}
    </PageContent>
  );
}
