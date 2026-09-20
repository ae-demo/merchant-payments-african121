// wireframes.dsl: screen PaymentLinks — table Created|Amount|Status ->
// PaymentLinkDetail, "New payment link" primary -> CreatePaymentLink.
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, ListingTable, PageContent, PageTitle } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";
import { formatDateTime, formatMoney, statusColor, titleCase } from "../format";

type PaymentLink = components["schemas"]["PaymentLink"];

export function PaymentLinksPage(): JSX.Element {
  const navigate = useNavigate();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void paymentsApi.GET("/me/payment-links", { params: { query: { limit: 50 } } }).then(({ data }) => {
      if (live && data) setLinks(data.data);
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
        <PageTitle.Header>Payment links</PageTitle.Header>
        <PageTitle.Actions>
          <Button variant="contained" onClick={() => navigate("/payment-links/new")}>
            New payment link
          </Button>
        </PageTitle.Actions>
      </PageTitle>
      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Created</ListingTable.Cell>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {links.length === 0 && !loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <ListingTable.EmptyState
                    title="No payment links yet"
                    description="Generate one to start collecting payments."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              links.map((link) => (
                <ListingTable.Row
                  key={link.id}
                  clickable
                  onClick={() => navigate(`/payment-links/${link.id}`)}
                >
                  <ListingTable.Cell>{formatDateTime(link.createdAt)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMoney(link.amount, link.currency)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={titleCase(link.status)} color={statusColor(link.status)} size="small" />
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
