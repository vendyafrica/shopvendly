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

interface SuperAdminInviteEmailProps {
    invitedByName: string;
    url: string;
}

export const SuperAdminInviteEmail: React.FC<Readonly<SuperAdminInviteEmailProps>> = ({
    invitedByName,
    url,
}) => (
    <Html>
        <Head />
        <Body style={main}>
            <Preview>You&apos;ve been invited to become a Vendly Super Admin</Preview>
            <Container style={container}>
                <Heading style={h1}>Vendly Super Admin Invite</Heading>
                <Text style={text}>
                    You&apos;ve been invited by {invitedByName} to become a super admin on Vendly.
                </Text>
                <Text style={text}>
                    This invite link is valid for 24 hours.
                </Text>
                <Section style={buttonContainer}>
                    <Button href={url} style={button}>
                        Accept Invite
                    </Button>
                </Section>
                <Text style={footerText}>
                    If you don&apos;t have an account yet, please sign up first using this email address,
                    then open the invite link again.
                </Text>
                <Text style={footerText}>
                    If you didn&apos;t expect this invite, you can ignore this email.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default SuperAdminInviteEmail;

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
