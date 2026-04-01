/**
 * Global error handler middleware.
 * Catches all errors passed via next(err) and returns a consistent JSON response.
 */
export const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${statusCode}: ${message}`);
  if (isDev) console.error(err.stack);

  return res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors?.length && { errors: err.errors }),
    ...(isDev && { stack: err.stack }),
  });
};
