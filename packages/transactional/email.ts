import { resend } from './resend';
import { render } from '@react-email/components';
import * as React from 'react';

interface SendWelcomeEmailProps {
  to: string;
  name: string;
  storefrontUrl: string;
  dashboardUrl: string;
  connectInstagramUrl: string;
}

export const sendWelcomeEmail = async ({
  to,
  name,
  storefrontUrl,
  dashboardUrl,
  connectInstagramUrl,
}: SendWelcomeEmailProps) => {
  const { default: SellerWelcomeEmail } = await import('./emails/welcome');
  const emailHtml = await render(
    React.createElement(SellerWelcomeEmail, {
      name,
      storefrontUrl,
      dashboardUrl,
      connectInstagramUrl,
    })
  );

  const data = await resend.emails.send({
    from: 'Vendly <noreply@vendlyafrica.store>',
    to,
    subject: 'Welcome to Vendly! Your store is ready',
    html: emailHtml,
  });

  if (data.error) {
    console.error("Welcome email failed", data.error);
    throw new Error(`Welcome email failed: ${data.error.message || JSON.stringify(data.error)}`);
  }

  return data;
};

interface SendAdminVerificationProps {
  to: string;
  name: string;
  verificationUrl: string;
}

export const sendAdminVerificationEmail = async ({ to, name, verificationUrl }: SendAdminVerificationProps) => {
  const { AdminVerificationEmail } = await import('./emails/admin-verification');
  const emailHtml = await render(React.createElement(AdminVerificationEmail, {
    name,
    url: verificationUrl,
  }));

  const data = await resend.emails.send({
    from: 'Vendly Admin <admin@vendlyafrica.store>',
    to,
    subject: 'Verify your Vendly Admin account',
    html: emailHtml,
  });

  if (data.error) {
    console.error("Admin verification email failed", data.error);
    throw new Error("Admin verification email failed to send");
  }

  return data;
};

interface SendSuperAdminInviteProps {
  to: string;
  invitedByName: string;
  inviteUrl: string;
}

export const sendSuperAdminInviteEmail = async ({ to, invitedByName, inviteUrl }: SendSuperAdminInviteProps) => {
  const { SuperAdminInviteEmail } = await import('./emails/super-admin-invite');
  const emailHtml = await render(React.createElement(SuperAdminInviteEmail, {
    invitedByName,
    url: inviteUrl,
  }));

  const data = await resend.emails.send({
    from: 'Vendly Admin <admin@vendlyafrica.store>',
    to,
    subject: 'You have been invited to become a Vendly Super Admin',
    html: emailHtml,
  });

  if (data.error) {
    console.error("Super admin invite email failed", data.error);
    throw new Error("Super admin invite email failed to send");
  }

  return data;
};

export default sendWelcomeEmail;