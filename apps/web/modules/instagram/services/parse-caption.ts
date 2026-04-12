export function parseInstagramCaption(
  caption: string | null | undefined,
  defaultCurrency: string = "UGX"
): {
  productName: string;
  priceAmount: number;
  currency: string;
  description: string | null;
} {
  return {
    productName: "Instagram Product",
    priceAmount: 0,
    currency: defaultCurrency,
    description: "A product from our instagram account",
  };
}