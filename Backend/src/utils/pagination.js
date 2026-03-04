export const parsePagination = (query = {}, options = {}) => {
  const defaultPage = options.defaultPage || 1;
  const defaultLimit = options.defaultLimit || 20;
  const maxLimit = options.maxLimit || 100;

  const page = Math.max(Number(query.page) || defaultPage, 1);
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

export const buildPagination = ({ page, limit, total }) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const buildPaginationResult = ({ items, page, limit, total }) => {
  return {
    items,
    pagination: buildPagination({ page, limit, total }),
  };
};
