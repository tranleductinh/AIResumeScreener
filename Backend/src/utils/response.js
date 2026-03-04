const extractMeta = (data, meta = null) => {
  if (meta) {
    return meta;
  }

  if (data && typeof data === "object" && !Array.isArray(data) && data.pagination) {
    return {
      pagination: data.pagination,
    };
  }

  return undefined;
};

export const success = (res, message, data, status = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  const resolvedMeta = extractMeta(data, meta);
  if (resolvedMeta) {
    response.meta = resolvedMeta;
  }

  return res.status(status).json(response);
};

export const error = (res, message, errorCode, status = 400, details = null) => {
  const response = {
    success: false,
    message,
    errorCode,
  };

  if (details) {
    response.details = details;
  }

  return res.status(status).json(response);
};
