// wireframes.dsl: screen PayMobileMoney (F2, public) — Mobile number input,
// "Confirm payment" primary -> PaymentReceipt.
import { useState, type JSX, type FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Form, PageContent, PageTitle, TextField } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";

export function PayMobileMoneyPage(): JSX.Element {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const merchantName = (useLocation().state as { merchantName?: string } | null)?.merchantName;
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!linkId) return;
    setSubmitting(true);
    setError(null);
    const { data, error: apiError } = await paymentsApi.POST("/payment-links/{linkId}/pay", {
      params: { path: { linkId } },
      body: { method: "mobile-money", payerPhone: phone },
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
        <PageTitle.Header>Pay with Mobile Money</PageTitle.Header>
      </PageTitle>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Box component="form" onSubmit={handleSubmit}>
        <Form.Section>
          <Form.Stack spacing={2}>
            <TextField
              label="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
