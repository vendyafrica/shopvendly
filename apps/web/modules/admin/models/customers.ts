export type CustomerRow = {
  name: string;
  email: string;
  orders: number;
  totalSpend: number;
  currency: string;
  lastOrder: string;
  status: "Active" | "Churn Risk" | "New";
};
