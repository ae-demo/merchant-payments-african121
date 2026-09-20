// wireframes.dsl: screen PayCard (F2, public) — Card number/Expiry/CVV
// inputs, "Confirm payment" primary -> PaymentReceipt.
//
// payments-api's PaymentRequest takes a `payerCardToken`, not raw card
// fields — this app implements no payment processing or real tokenization
// (component contract: "no payment logic implemented client-side"). The token
// sent here is a placeholder built from the input purely to populate that
// required field; a real deployment would tokenize the card through a PCI-
// scoped payment element before this screen ever sees the PAN.
import { useState, type JSX, type FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Form, PageContent, PageTitle, TextField } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";

export function PayCardPage(): JSX.Element {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const merchantName = (useLocation().state as { merchantName?: string } | null)?.merchantName;
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!linkId) return;
    setSubmitting(true);
    setError(null);
    const last4 = cardNumber.replace(/\s+/g, "").slice(-4);
    const { data, error: apiError } = await paymentsApi.POST("/payment-links/{linkId}/pay", {
      params: { path: { linkId } },
      body: { method: "card", payerCardToken: `tok_${last4}` },
    });
    setSubmitting(false);
    if (apiError || !data) {
      setError(apiError?.message ?? "The payment could not be completed.");
      return;
    }
    navigate(`/pay/${linkId}/receipt`, { state: { transaction: data, merchantName } });
  }

  return (
    <PageContent maxWidth={480}>
      <PageTitle>
        <PageTitle.Header>Pay with Card</PageTitle.Header>
      </PageTitle>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Box component="form" onSubmit={handleSubmit}>
        <Form.Section>
          <Form.Stack spacing={2}>
            <TextField
              label="Card number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Expiry"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              required
              fullWidth
            />
            <TextField
              label="CVV"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              required
              fullWidth
            />
          </Form.Stack>
        </Form.Section>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button type="submit" variant="contained" disabled={submitting}>
            Confirm payment
          </Button>
        </Box>
      </Box>
    </PageContent>
  );
}
