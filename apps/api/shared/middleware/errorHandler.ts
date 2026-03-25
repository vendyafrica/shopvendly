import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors.js";

/**
 * Centralized Express error handler.
 *
 * Must be registered LAST in app.ts:
 *   app.use(errorHandler);
 *
 * Handlers should:
 *   - throw ApiError subclasses for known error conditions
 *   - call next(err) for unexpected errors
 *
 * This middleware maps errors to safe, consistent JSON responses
 * that never expose stack traces or internal details.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Always log the full error server-side
  console.error("[ErrorHandler]", err);

  // Known API errors (NotFoundError, ForbiddenError, ValidationError, etc.)
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details !== undefined && { details: err.details }),
    });
    return;
  }

  // Zod validation errors thrown directly (safeParse → throw)
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.flatten(),
    });
    return;
  }

  // Express/known HTTP errors with a status attached
  if (err instanceof Error && "status" in err) {
    const status = (err as Error & { status: unknown }).status;
    if (typeof status === "number" && status >= 400 && status < 500) {
      res.status(status).json({
        error: err.message,
        code: "CLIENT_ERROR",
      });
      return;
    }
  }

  // Default: 500 — never leak internals
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
