"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  type ColumnDef,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shopvendly/ui/components/table";
import { Button } from "@shopvendly/ui/components/button";
import { cn } from "@shopvendly/ui/lib/utils";

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  pageSize = 20,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  onRowClick,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  pageSize?: number;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void;
  getRowId?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
}) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize }));
  }, [pageSize]);

  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    onRowSelectionChange,
    onPaginationChange: setPagination,
    state: {
      rowSelection: rowSelection ?? {},
      pagination,
    },
  });

  return (
    <div className="space-y-4">
      <Table className={cn("w-full text-sm", className)}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-border/50 hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="h-12 px-4 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
                  style={header.getSize() !== 150 ? { width: header.getSize() } : undefined}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id} 
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  "border-b border-border/40 last:border-b-0",
                  onRowClick && "cursor-pointer transition-colors hover:bg-muted/[0.035]"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 px-4 text-center text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-3 px-2 pb-1">
        <p className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 rounded-lg border-border/60 px-3 text-xs"
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 rounded-lg border-border/60 px-3 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
