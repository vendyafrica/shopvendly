"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@shopvendly/ui/components/badge";
import { cn } from "@shopvendly/ui/lib/utils";
import { DataTable } from "./data-table";
import { type TransactionRow } from "@/modules/admin/models";

const columns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-medium">{row.original.id}</span>,
  },
  {
    accessorKey: "customer",
    header: "Customer",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const cls =
        status === "Completed"
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700"
          : status === "Failed"
            ? "bg-rose-100 text-rose-700 hover:bg-rose-100 hover:text-rose-700"
            : "bg-amber-100 text-amber-700 hover:bg-amber-100 hover:text-amber-700";
      return (
        <Badge variant="outline" className={cn("px-2 py-0.5 rounded-full text-xs font-normal border-0", cls)}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "date",
    header: () => <div className="text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground text-xs">{row.original.date}</div>
    ),
  },
];

export function OrdersTable({ 
  rows, 
  onRowClick 
}: { 
  rows: TransactionRow[];
  onRowClick?: (row: TransactionRow) => void;
}) {
  return (
    <div className="w-full">
      <DataTable 
        columns={columns} 
        data={rows} 
        onRowClick={onRowClick}
      />
    </div>
  );
}
