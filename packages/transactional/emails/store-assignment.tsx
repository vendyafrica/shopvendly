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
    Hr,
} from '@react-email/components';
import * as React from 'react';

interface StoreAssignmentEmailProps {
    storeName: string;
    onboardingUrl: string;
}

export const StoreAssignmentEmail: React.FC<Readonly<StoreAssignmentEmailProps>> = ({
    storeName,
    onboardingUrl,
}) => (
    <Html>
        <Head />
        <Body style={main}>
            <Preview>Your {storeName} store on Vendly is ready — start setting it up</Preview>
            <Container style={container}>
                <Heading style={h1}>🎉 Your store is waiting for you</Heading>

                <Text style={text}>
                    Great news! A store called <strong>{storeName}</strong> has been set up on
                    Vendly and is ready for you to claim and customise.
                </Text>

                <Text style={text}>
                    Your existing store content — products, posts, and media — is already there.
                    All you need to do is fill in your store details (name, description, contact
                    info) and you&apos;re good to go.
                </Text>

                <Section style={buttonContainer}>
                    <Button href={onboardingUrl} style={button}>
                        Set Up My Store
                    </Button>
                </Section>

                <Hr style={divider} />

                <Text style={footerText}>
                    This link is valid for 24 hours. After completing setup you&apos;ll be taken
                    straight to your store&apos;s dashboard where you can manage products, orders,
                    and more.
                </Text>

                <Text style={footerText}>
                    If you weren&apos;t expecting this email, you can safely ignore it.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default StoreAssignmentEmail;

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
    fontSize: '26px',
    fontWeight: '700',
    marginBottom: '24px',
    textAlign: 'center' as const,
};

const text = {
    color: '#484848',
    fontSize: '16px',
    lineHeight: '26px',
    marginBottom: '16px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#5469d4',
    color: '#ffffff',
    padding: '14px 32px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block',
};

const divider = {
    borderColor: '#e6ebf1',
    margin: '24px 0',
};

const footerText = {
    color: '#8898aa',
    fontSize: '14px',
    lineHeight: '20px',
    marginTop: '8px',
};
