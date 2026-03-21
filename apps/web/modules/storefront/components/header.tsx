import StorefrontHeaderClient, { type StorefrontHeaderProps } from "./header.client";

export function StorefrontHeader(props: StorefrontHeaderProps) {
  return <StorefrontHeaderClient {...props} />;
}