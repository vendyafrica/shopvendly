"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { data-table } from "../components/data-table";

export type CustomerRow = {
  name: string;
  email: string;
  orders: number;
  totalSpend: number;
  currency: string;
  lastOrder: string;
  status: "Active" | "Churn Risk" | "New";
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "orders",
    header: "Orders",
  },
  {
    accessorKey: "totalSpend",
    header: "Total Spend",
    cell: ({ row }) => formatCurrency(row.original.totalSpend, row.original.currency),
  },
  {
    accessorKey: "lastOrder",
    header: "Last Order",
    cell: ({ row }) =>
      new Date(row.original.lastOrder).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const tone =
        status === "Active" ? "text-emerald-600" : status === "New" ? "text-primary" : "text-amber-600";
      return <span className={`text-sm font-medium ${tone}`}>{status}</span>;
    },
  },
];

export function CustomersTable({ rows }: { rows: CustomerRow[] }) {
  return <data-table columns={columns} data={rows} />;
}
