// wireframes.dsl: screen OnboardingQueue "Merchants pending KYC review"
// table "Business | Owner | Country | Submitted" -> MerchantReview
//
// GAP: payments-api's Merchant schema carries no submission/created date
// anywhere (not on Merchant, not on any other list this screen could join),
// so the "Submitted" column cannot be built and is dropped here — reported to
// the lead as a wireframe/contract mismatch.
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageContent,
  PageTitle,
  ListingTable,
  CircularProgress,
  Box,
  Alert,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Merchant = components["schemas"]["Merchant"];

export default function OnboardingQueuePage(): JSX.Element {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    paymentsApi
      .GET("/merchants", { params: { query: { kycStatus: "pending", limit: 100 } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError("Could not load pending merchants.");
          return;
        }
        setMerchants(data?.data ?? []);
      })
      .catch(() => live && setError("Could not load pending merchants."));
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Pending merchants</PageTitle.Header>
        <PageTitle.SubHeader>Merchants pending KYC review</PageTitle.SubHeader>
      </PageTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!merchants && !error && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {merchants && (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Business</ListingTable.Cell>
                <ListingTable.Cell>Owner</ListingTable.Cell>
                <ListingTable.Cell>Country</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {merchants.map((merchant) => (
                <ListingTable.Row
                  key={merchant.id}
                  clickable
                  onClick={() => navigate(`/onboarding/${merchant.id}`)}
                >
                  <ListingTable.Cell>{merchant.businessName}</ListingTable.Cell>
                  <ListingTable.Cell>{merchant.ownerName}</ListingTable.Cell>
                  <ListingTable.Cell>{merchant.country}</ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {merchants.length === 0 && (
            <ListingTable.EmptyState
              title="No merchants pending review"
              description="Every submitted application has been reviewed."
            />
          )}
        </ListingTable.Container>
      )}
    </PageContent>
  );
}
