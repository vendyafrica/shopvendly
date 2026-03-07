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
import * as React from "react";

interface NewStoreAlertEmailProps {
    storeName: string;
    storeSlug: string;
    sellerName: string;
    sellerEmail: string;
    adminStoreUrl: string;
}

export const NewStoreAlertEmail = ({
    storeName,
    storeSlug,
    sellerName,
    sellerEmail,
    adminStoreUrl,
}: NewStoreAlertEmailProps) => (
    <Html>
        <Head />
        <Preview>New Store Created: {storeName}</Preview>

        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    <Img
                        src="https://shopvendly.store/vendly.png"
                        width="28"
                        height="28"
                        alt="Vendly"
                        style={logo}
                    />
                    <Text style={brand}>vendly admin</Text>
                </Section>

                <Heading style={h1}>New Store: {storeName}</Heading>

                <Text style={text}>
                    A new store has just been created on Vendly by <strong>{sellerName}</strong> ({sellerEmail}).
                </Text>

                <Section style={card}>
                    <Text style={cardTitle}>Store Details</Text>

                    <Text style={label}>Name</Text>
                    <Text style={value}>{storeName}</Text>

                    <Text style={label}>Slug</Text>
                    <Text style={value}>{storeSlug}</Text>

                    <Text style={label}>Owner</Text>
                    <Text style={value}>{sellerName}</Text>
                </Section>

                <Section style={ctaSection}>
                    <Link href={adminStoreUrl} style={primaryButton}>
                        View in Admin Dashboard
                    </Link>
                </Section>
            </Container>
        </Body>
    </Html>
);

export default NewStoreAlertEmail;

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

const value = {
    fontSize: "14px",
    color: "#111827",
    margin: "0 0 12px 0",
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
