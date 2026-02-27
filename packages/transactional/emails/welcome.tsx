import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface SellerWelcomeEmailProps {
  name: string;
  storefrontUrl: string;
  dashboardUrl: string;
  connectInstagramUrl: string;
}

export const SellerWelcomeEmail = ({
  name,
  storefrontUrl,
  dashboardUrl,
  connectInstagramUrl,
}: SellerWelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Vendly store is live</Preview>

    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Img
            src="https://vendlyafrica.store/vendly.png"
            width="28"
            height="28"
            alt="Vendly"
            style={logo}
          />
          <Text style={brand}>vendly</Text>
        </Section>

        {/* Heading */}
        <Heading style={h1}>Welcome, {name}</Heading>

        <Text style={text}>
          Your storefront is ready. Connect your Instagram and start accepting
          structured orders without manual back-and-forth.
        </Text>

        {/* Primary CTA */}
        <Section style={ctaSection}>
          <Link href={connectInstagramUrl} style={primaryButton}>
            Connect Instagram
          </Link>
        </Section>

        {/* Links Card */}
        <Section style={card}>
          <Text style={cardTitle}>Store Links</Text>

          <Text style={label}>Public Storefront</Text>
          <Link href={storefrontUrl} style={link}>
            {storefrontUrl}
          </Link>

          <Text style={label}>Seller Dashboard</Text>
          <Link href={dashboardUrl} style={link}>
            {dashboardUrl}
          </Link>
        </Section>

        {/* Next Steps */}
        <Section style={steps}>
          <Text style={stepsTitle}>Next steps</Text>
          <Text style={stepItem}>1. Connect Instagram</Text>
          <Text style={stepItem}>2. Add your first products</Text>
          <Text style={stepItem}>3. Share your link in bio</Text>
        </Section>

        {/* Footer */}
        <Text style={footer}>
          This email verifies your account. The link expires in 24 hours.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SellerWelcomeEmail;

/* =========================
   Styles (shadcn-inspired)
========================= */

const main = {
  backgroundColor: "#f8f9fb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "40px 16px",
};

const container = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "32px",
  border: "1px solid #e5e7eb",
};

const header = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "24px",
};

const logo = {
  borderRadius: "6px",
};

const brand = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#111827",
  margin: 0,
};

const h1 = {
  fontSize: "22px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 12px 0",
};

const text = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#4b5563",
  margin: "0 0 24px 0",
};

const ctaSection = {
  textAlign: "center" as const,
  marginBottom: "28px",
};

const primaryButton = {
  display: "inline-block",
  backgroundColor: "#111827",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 500,
  textDecoration: "none",
};

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
  marginBottom: "24px",
};

const cardTitle = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 12px 0",
};

const label = {
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "#9ca3af",
  margin: "12px 0 4px 0",
};

const link = {
  fontSize: "14px",
  color: "#111827",
  textDecoration: "none",
  wordBreak: "break-all" as const,
};

const steps = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
  marginBottom: "24px",
};

const stepsTitle = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 8px 0",
};

const stepItem = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "4px 0",
};

const footer = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: 0,
};
