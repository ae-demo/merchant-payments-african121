// wireframes.dsl: screen Onboarding "Sign up your business and submit KYC
// details" — heading, business/owner/contact fields, country + currency
// selects, "Submit for review" primary -> Dashboard.
import { useEffect, useState, type JSX, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Form,
  MenuItem,
  PageContent,
  PageTitle,
  TextField,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";

const COUNTRIES = ["Kenya", "Nigeria", "Ghana", "Uganda", "Tanzania", "South Africa"];
const CURRENCIES = ["KES", "NGN", "GHS", "UGX", "TZS", "ZAR", "USD"];

export function OnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void paymentsApi.GET("/me/merchant").then(({ data }) => {
      if (!live || !data) return;
      setBusinessName(data.businessName);
      setOwnerName(data.ownerName);
      setCountry(data.country);
      setCurrency(data.currency);
      setContactEmail(data.contactEmail ?? "");
      setContactPhone(data.contactPhone ?? "");
    }).finally(() => {
      if (live) setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: apiError } = await paymentsApi.PUT("/me/merchant", {
      body: { businessName, ownerName, country, currency, contactEmail, contactPhone },
    });
    setSubmitting(false);
    if (apiError) {
      setError(apiError.message ?? "Could not save your business details.");
      return;
    }
    navigate("/dashboard");
  }

  if (loading) return <PageContent><Box sx={{ p: 4 }}>Loading…</Box></PageContent>;

  return (
    <PageContent maxWidth={640}>
      <PageTitle>
        <PageTitle.Header>Register your business</PageTitle.Header>
      </PageTitle>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Box component="form" onSubmit={handleSubmit}>
        <Form.Section>
          <Form.Stack spacing={2}>
            <TextField
              label="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Owner full name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              select
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              fullWidth
            >
              {COUNTRIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              fullWidth
            >
              {CURRENCIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Contact email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Contact phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
              fullWidth
            />
          </Form.Stack>
        </Form.Section>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button type="submit" variant="contained" disabled={submitting}>
            Submit for review
          </Button>
        </Box>
      </Box>
    </PageContent>
  );
}
