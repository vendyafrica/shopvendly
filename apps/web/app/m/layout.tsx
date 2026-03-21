import type { ReactNode } from "react";
import { headers } from "next/headers";
import { auth } from "@shopvendly/auth";
import { CartProvider } from "@/modules/cart/context/cart-context";
import { AppSessionProvider } from "@/contexts/app-session-context";
import { PostHogProvider, Providers } from "../providers";

export default async function MarketplaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });

  return (
    <PostHogProvider>
      <Providers>
        <AppSessionProvider session={session}>
          <CartProvider>{children}</CartProvider>
        </AppSessionProvider>
      </Providers>
    </PostHogProvider>
  );
}

