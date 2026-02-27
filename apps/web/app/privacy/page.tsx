import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Duuka collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

const SUPPORT_EMAIL = "support@vendlyafrica.store";
const APP_NAME = "Vendly Africa";
const JURISDICTION = "Uganda";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toISOString().split("T")[0]}</p>
        <p>
          {APP_NAME} (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates a digital commerce platform that
          helps businesses and creators run storefronts and manage orders. This
          Privacy Policy explains what we collect, why we collect it, and how you can
          exercise your rights.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account & profile:</strong> name, email, phone, business/storefront details you provide.
          </li>
          <li>
            <strong>Google Sign-In (if used):</strong> basic profile data (name, email, profile image) to create and secure your account.
          </li>
          <li>
            <strong>Usage & device:</strong> IP address, browser/device info, app interactions, and logs.
          </li>
          <li>
            <strong>Payments (if applicable):</strong> transaction metadata via payment providers; we do not store full card or MoMo details.
          </li>
          <li>
            <strong>Cookies/session:</strong> to keep you signed in, secure the service, and remember preferences.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How We Use Information</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide and secure your account and storefront.</li>
          <li>Process orders, payments, and support requests.</li>
          <li>Improve performance, reliability, and user experience.</li>
          <li>Detect, prevent, and address fraud or abuse.</li>
          <li>Comply with legal obligations.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Sharing</h2>
        <p>We do not sell personal data. We may share with:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Service providers (hosting, analytics, payments, messaging) under confidentiality obligations.</li>
          <li>Third-party integrations you connect (e.g., payment providers) per your authorization.</li>
          <li>Law enforcement or regulators when required by law.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Analytics & Tracking</h2>
        <p>
          We may use analytics and performance tools (e.g., Vercel Analytics / Speed Insights) to understand usage and
          improve reliability. Cookies and similar technologies help maintain sessions and security.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Data Retention</h2>
        <p>
          We retain personal data while your account is active and as needed for security, compliance, and recordkeeping.
          You may request deletion at any time.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your Choices</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Access, correct, or update your account information in the app.</li>
          <li>Request deletion by emailing <Link href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">{SUPPORT_EMAIL}</Link>.</li>
          <li>Manage cookies via your browser settings (some features may not work without cookies).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Children</h2>
        <p>
          The service is not intended for children under 13. We do not knowingly collect data from children.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Changes</h2>
        <p>
          We may update this Privacy Policy. If changes are material, we will post the new date and, where required, notify you.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          Questions or requests: <Link href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">{SUPPORT_EMAIL}</Link>
          {" "} | {APP_NAME} | Governing law: {JURISDICTION}
        </p>
      </section>
    </main>
  );
}
