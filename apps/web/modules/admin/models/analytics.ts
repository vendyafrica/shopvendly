export type OverviewResponse = {
  range: { from: string; to: string };
  currency: string;
  kpis: {
    revenuePaid: number;
    ordersPaid: number;
    aov: number;
    refunds: number;
  };
  timeseries: Array<{ date: string; revenuePaid: number; ordersPaid: number }>;
  traffic: {
    visits: number;
    uniqueVisitors: number;
    returningVisitors: number;
    timeseries: Array<{ date: string; visits: number; uniqueVisitors: number }>;
  };
  topViewed: Array<{ productId: string | null; productName: string | null; count: number }>;
  topAddToCart: Array<{ productId: string | null; productName: string | null; count: number }>;
};
