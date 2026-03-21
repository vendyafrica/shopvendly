"use client";

import { DataTable } from "@/modules/admin/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@shopvendly/ui/components/badge";

export type NotificationRow = {
  id: string;
  type: "Order" | "System" | "Alert" | "Payment";
  summary: string;
  channel: "In-App";
  status: "New";
  time: string;
};

const columns: ColumnDef<NotificationRow>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <span className="font-medium">{row.original.type}</span>,
  },
  {
    accessorKey: "summary",
    header: "Summary",
    cell: ({ row }) => <span className="text-sm text-foreground">{row.original.summary}</span>,
  },
  {
    accessorKey: "channel",
    header: "Channel",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.original.status === "New"
            ? "bg-emerald-100 text-emerald-700 border-0"
            : "bg-muted text-muted-foreground border-0"
        }
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.time}</span>,
  },
];

export function NotificationsTable({ rows }: { rows: NotificationRow[] }) {
  return <DataTable columns={columns} data={rows} />;
}
