import { eq, isNull, type AnyColumn } from "@shopvendly/db";

export type PaginationOptions = {
  page?: number;
  perPage?: number;
  limit?: number;
  offset?: number;
};

export type PaginationResult = {
  limit: number;
  offset: number;
};

export function withSoftDelete<TColumn extends AnyColumn>(column: TColumn) {
  return isNull(column);
}

export function withTenant<TColumn extends AnyColumn, TValue>(column: TColumn, tenantId: TValue) {
  return eq(column, tenantId);
}

export function getPagination(options: PaginationOptions = {}): PaginationResult {
  if (typeof options.limit === "number" || typeof options.offset === "number") {
    return {
      limit: Math.max(1, options.limit ?? 50),
      offset: Math.max(0, options.offset ?? 0),
    };
  }

  const perPage = Math.max(1, options.perPage ?? 20);
  const page = Math.max(1, options.page ?? 1);

  return {
    limit: perPage,
    offset: (page - 1) * perPage,
  };
}
