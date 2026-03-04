import { resend } from './resend';
import { render } from '@react-email/components';
import * as React from 'react';

interface SendWelcomeEmailProps {
  to: string;
  name: string;
  storefrontUrl: string;
  adminUrl: string;
  connectInstagramUrl: string;
}

export const sendWelcomeEmail = async ({
  to,
  name,
  storefrontUrl,
  adminUrl,
  connectInstagramUrl,
}: SendWelcomeEmailProps) => {
  console.info("[email] Sending welcome email", { to, storefrontUrl });
  const { default: SellerWelcomeEmail } = await import('./emails/welcome');
  const emailHtml = await render(
    React.createElement(SellerWelcomeEmail, {
      name,
      storefrontUrl,
      adminUrl,
      connectInstagramUrl,
    })
  );

  let data;
  try {
    data = await resend.emails.send({
      from: 'Vendly <noreply@shopvendly.store>',
      to,
      subject: 'Welcome to Vendly! Your store is ready',
      html: emailHtml,
    });
  } catch (error) {
    console.error("[email] Welcome email request failed", { to, error });
    throw error;
  }

  if (data.error) {
    console.error("[email] Welcome email rejected", { to, error: data.error });
    throw new Error(`Welcome email failed: ${data.error.message || JSON.stringify(data.error)}`);
  }

  console.info("[email] Welcome email sent", { to, id: data.data?.id ?? null });
  return data;
};

interface SendAdminVerificationProps {
  to: string;
  name: string;
  verificationUrl: string;
}

export const sendAdminVerificationEmail = async ({ to, name, verificationUrl }: SendAdminVerificationProps) => {
  console.info("[email] Sending admin verification email", { to, verificationUrl });
  const { AdminVerificationEmail } = await import('./emails/admin-verification');
  const emailHtml = await render(React.createElement(AdminVerificationEmail, {
    name,
    url: verificationUrl,
  }));

  let data;
  try {
    data = await resend.emails.send({
      from: 'Vendly Admin <admin@shopvendly.store>',
      to,
      subject: 'Verify your Vendly Admin account',
      html: emailHtml,
    });
  } catch (error) {
    console.error("[email] Admin verification request failed", { to, error });
    throw error;
  }

  if (data.error) {
    console.error("[email] Admin verification rejected", { to, error: data.error });
    throw new Error("Admin verification email failed to send");
  }

  console.info("[email] Admin verification email sent", { to, id: data.data?.id ?? null });
  return data;
};

interface SendSuperAdminInviteProps {
  to: string;
  invitedByName: string;
  inviteUrl: string;
}

export const sendSuperAdminInviteEmail = async ({ to, invitedByName, inviteUrl }: SendSuperAdminInviteProps) => {
  console.info("[email] Sending super admin invite", { to, invitedByName });
  const { SuperAdminInviteEmail } = await import('./emails/super-admin-invite');
  const emailHtml = await render(React.createElement(SuperAdminInviteEmail, {
    invitedByName,
    url: inviteUrl,
  }));

  let data;
  try {
    data = await resend.emails.send({
      from: 'Vendly Admin <admin@shopvendly.store>',
      to,
      subject: 'You have been invited to become a Vendly Super Admin',
      html: emailHtml,
    });
  } catch (error) {
    console.error("[email] Super admin invite request failed", { to, error });
    throw error;
  }

  if (data.error) {
    console.error("[email] Super admin invite rejected", { to, error: data.error });
    throw new Error("Super admin invite email failed to send");
  }

  console.info("[email] Super admin invite email sent", { to, id: data.data?.id ?? null });
  return data;
};


export default sendWelcomeEmail;

interface SendStoreAssignmentEmailProps {
  to: string;
  storeName: string;
  onboardingUrl: string;
}

export const sendStoreAssignmentEmail = async ({
  to,
  storeName,
  onboardingUrl,
}: SendStoreAssignmentEmailProps) => {
  console.info("[email] Sending store assignment email", { to, storeName });
  const { StoreAssignmentEmail } = await import('./emails/store-assignment');
  const emailHtml = await render(React.createElement(StoreAssignmentEmail, {
    storeName,
    onboardingUrl,
  }));

  let data;
  try {
    data = await resend.emails.send({
      from: 'Vendly <noreply@shopvendly.store>',
      to,
      subject: `Your ${storeName} store is ready on Vendly`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[email] Store assignment email request failed", { to, error });
    throw error;
  }

  if (data.error) {
    console.error("[email] Store assignment email rejected", { to, error: data.error });
    throw new Error(`Store assignment email failed: ${data.error.message || JSON.stringify(data.error)}`);
  }

  console.info("[email] Store assignment email sent", { to, id: data.data?.id ?? null });
  return data;
};
