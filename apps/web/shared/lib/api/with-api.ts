import { ZodError, type ZodType } from "zod";
import { type NextRequest } from "next/server";
import { jsonError, requireAuth, HttpError } from "./response-utils";

type Session = Awaited<ReturnType<typeof requireAuth>>;

type ApiContext<TBody, TParams extends Record<string, string>> = {
  req: NextRequest;
  params: { [K in keyof TParams]: string };
  session: Session;
  body: TBody;
};

type PublicApiContext<TBody, TParams extends Record<string, string>> = {
  req: NextRequest;
  params: { [K in keyof TParams]: string };
  session: Session | null;
  body: TBody;
};

type ApiHandler<TBody, TParams extends Record<string, string>> = (
  ctx: ApiContext<TBody, TParams>,
) => Promise<Response>;

type PublicApiHandler<TBody, TParams extends Record<string, string>> = (
  ctx: PublicApiContext<TBody, TParams>,
) => Promise<Response>;

type WithApiOptions<TBody> = {
  auth?: boolean;
  schema?: ZodType<TBody>;
};

/**
 * Wraps an API route handler with standardized auth, validation, and error handling.
 *
 * - auth: true (default) — requires a valid session, throws 401 otherwise
 * - auth: false — session is null, no auth check performed
 * - schema — parses request body with Zod; returns 400 with field details on failure
 *
 * All unhandled errors are caught and returned as 500 JSON responses.
 */
export function withApi<TBody = undefined, TParams extends Record<string, string> = Record<string, string>>(
  options: WithApiOptions<TBody> & { auth?: true },
  handler: ApiHandler<TBody, TParams>,
): (req: NextRequest, context: { params: Promise<TParams> }) => Promise<Response>;

export function withApi<TBody = undefined, TParams extends Record<string, string> = Record<string, string>>(
  options: WithApiOptions<TBody> & { auth: false },
  handler: PublicApiHandler<TBody, TParams>,
): (req: NextRequest, context: { params: Promise<TParams> }) => Promise<Response>;

export function withApi<TBody = undefined, TParams extends Record<string, string> = Record<string, string>>(
  options: WithApiOptions<TBody>,
  handler: ApiHandler<TBody, TParams> | PublicApiHandler<TBody, TParams>,
) {
  return async (req: NextRequest, context: { params: Promise<TParams> }) => {
    try {
      const params = await context.params;

      let body = undefined as TBody;
      if (options.schema) {
        const raw: unknown = await req.json();
        body = options.schema.parse(raw);
      }

      if (options.auth !== false) {
        const session = await requireAuth(req);
        return await (handler as ApiHandler<TBody, TParams>)({ req, params, session, body });
      }

      return await (handler as PublicApiHandler<TBody, TParams>)({ req, params, session: null, body });
    } catch (error) {
      if (error instanceof ZodError) {
        return jsonError("Validation failed", 400, {
          issues: error.issues.map((i) => ({ path: i.path, message: i.message })),
        });
      }
      if (error instanceof HttpError) {
        return jsonError(error.message, error.status, error.details);
      }
      console.error("[API Error]", error);
      return jsonError("Internal server error", 500);
    }
  };
}
