import { error as errorResponse } from "../utils/response.js";

export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  error.errorCode = "ROUTE_NOT_FOUND";
  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Internal server error";
  const details = err.details || null;

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  return errorResponse(res, message, errorCode, status, details);
};
