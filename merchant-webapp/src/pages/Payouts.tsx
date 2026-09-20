// wireframes.dsl: screen Payouts — table Requested|Amount|Destination|Status,
// "Request payout" primary -> RequestPayout.
//
// The Payout schema (payments-api openapi.yaml) carries destinationType but no
// masked account/wallet number, so the Destination column shows "Bank" /
// "Mobile Wallet" rather than the "Bank ****1234" the wireframe's demo row
// draws — no operation in the contract supplies the masked number.
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, ListingTable, PageContent, PageTitle } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";
import { formatDateTime, formatDestinationType, formatMoney, statusColor, titleCase } from "../format";

type Payout = components["schemas"]["Payout"];

export function PayoutsPage(): JSX.Element {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void paymentsApi.GET("/me/payouts", { params: { query: { limit: 50 } } }).then(({ data }) => {
      if (live && data) setPayouts(data.data);
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
        <PageTitle.Header>Payouts</PageTitle.Header>
        <PageTitle.Actions>
          <Button variant="contained" onClick={() => navigate("/payouts/new")}>
            Request payout
          </Button>
        </PageTitle.Actions>
      </PageTitle>
      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Requested</ListingTable.Cell>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Destination</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {payouts.length === 0 && !loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={4}>
                  <ListingTable.EmptyState
                    title="No payouts yet"
                    description="Request a payout to withdraw your balance."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              payouts.map((p) => (
                <ListingTable.Row key={p.id}>
                  <ListingTable.Cell>{formatDateTime(p.createdAt)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMoney(p.amount, p.currency)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatDestinationType(p.destinationType)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={titleCase(p.status)} color={statusColor(p.status)} size="small" />
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
