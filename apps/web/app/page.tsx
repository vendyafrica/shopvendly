import LandingPage, { metadata } from "./(marketing)/page";
import MarketingLayout from "./(marketing)/layout";

export { metadata };

export default function HomePage() {
  return (
    <MarketingLayout>
      <LandingPage />
    </MarketingLayout>
  );
}
