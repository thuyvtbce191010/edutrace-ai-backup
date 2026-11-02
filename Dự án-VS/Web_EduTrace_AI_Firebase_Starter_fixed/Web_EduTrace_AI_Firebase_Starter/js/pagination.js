// Pagination of an already filtered, in-memory list.
export function paginate(items, requestedPage = 1, pageSize = 10) {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new RangeError("Invalid page size");
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Math.trunc(requestedPage) || 1));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageCount, total: items.length };
}

export function updatePagination(container, result) {
  if (!container) return;
  container.querySelector('[data-page="previous"]').disabled = result.page === 1;
  container.querySelector('[data-page="next"]').disabled = result.page === result.pageCount;
  container.querySelector('[data-page="status"]').textContent =
    `Trang ${result.page}/${result.pageCount} · ${result.total} kết quả`;
}
