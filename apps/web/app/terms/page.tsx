import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the Duuka marketplace.",
  alternates: { canonical: "/terms" },
};

const SUPPORT_EMAIL = "support@vendlyafrica.store";
const APP_NAME = "Vendly Africa";
const JURISDICTION = "Uganda";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toISOString().split("T")[0]}</p>
        <p>
          By accessing or using {APP_NAME} (the &quot;Service&quot;), you agree to these Terms of Service. If you do not agree,
          do not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Eligibility & Accounts</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>You must be at least 18 years old or have legal authority to operate a business.</li>
          <li>You are responsible for the security of your account and all activity under it.</li>
          <li>Keep your information accurate and up to date.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Acceptable Use</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>No illegal, harmful, or fraudulent activity.</li>
          <li>No sale of prohibited or regulated goods/services.</li>
          <li>No interfering with or attempting to reverse engineer the Service.</li>
          <li>No uploading of malicious code.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Payments & Third Parties</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>The Service may integrate third-party payment and messaging providers. {APP_NAME} is not a bank or payment processor.</li>
          <li>Transaction issues are primarily between buyers and sellers; fees (if any) will be disclosed.</li>
          <li>Third-party services are subject to their own terms and policies.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Content & License</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>You retain ownership of content you submit.</li>
          <li>You grant {APP_NAME} a limited license to host, display, and process your content solely to operate and improve the Service.</li>
          <li>You represent that you have rights to the content you provide.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Termination</h2>
        <p>
          We may suspend or terminate access if you violate these Terms or pose risk to the platform. You may stop using the Service at any time.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Disclaimers</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free operation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, {APP_NAME} is not liable for indirect, incidental, or consequential damages. Our total liability is
          limited to amounts you paid to {APP_NAME} for the Service in the 12 months preceding the claim (if any).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Governing Law</h2>
        <p>These Terms are governed by the laws of {JURISDICTION}, without regard to conflict of law principles.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          Questions about these Terms: <Link href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">{SUPPORT_EMAIL}</Link>
          {" "} | {APP_NAME}
        </p>
      </section>
    </main>
  );
}
