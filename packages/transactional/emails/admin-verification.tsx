import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
    Button,
    Section,
} from '@react-email/components';
import * as React from 'react';

interface AdminVerificationEmailProps {
    name: string;
    url: string;
}

export const AdminVerificationEmail: React.FC<Readonly<AdminVerificationEmailProps>> = ({
    name,
    url,
}) => (
    <Html>
        <Head />
        <Body style={main}>
            <Preview>Verify your Vendly Admin account</Preview>
            <Container style={container}>
                <Heading style={h1}>Vendly Admin Access</Heading>
                <Text style={text}>
                    Hi {name},
                </Text>
                <Text style={text}>
                    You've been granted super admin access to the Vendly platform.
                    Please verify your email address to activate your account and access the admin dashboard.
                </Text>
                <Section style={buttonContainer}>
                    <Button href={url} style={button}>
                        Verify Email & Access Dashboard
                    </Button>
                </Section>
                <Text style={footerText}>
                    After verification, you'll be automatically signed in and redirected to the admin dashboard.
                </Text>
                <Text style={footerText}>
                    If you didn't request admin access, please ignore this email.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default AdminVerificationEmail;

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '40px',
    borderRadius: '8px',
    maxWidth: '600px',
};

const h1 = {
    color: '#1a1a1a',
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '30px',
    textAlign: 'center' as const,
};

const text = {
    color: '#484848',
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#5469d4',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block',
};

const footerText = {
    color: '#8898aa',
    fontSize: '14px',
    lineHeight: '20px',
    marginTop: '12px',
};
