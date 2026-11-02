// Cursor state is committed only after every query in a batch succeeds.
export function createCloudPager(collectionNames, fetchPage, pageSize = 50) {
  let cursors = Object.fromEntries(collectionNames.map(name => [name, null]));
  let complete = Object.fromEntries(collectionNames.map(name => [name, false]));
  let pending = null;
  return {
    reset() {
      if (pending) throw new Error('Đang tải dữ liệu.');
      cursors = Object.fromEntries(collectionNames.map(name => [name, null]));
      complete = Object.fromEntries(collectionNames.map(name => [name, false]));
    },
    async next() {
      if (pending) return pending;
      pending = (async () => {
        const active = collectionNames.filter(name => !complete[name]);
        const pages = await Promise.all(active.map(name => fetchPage(name, cursors[name], pageSize)));
        const result = {};
        for (let i = 0; i < active.length; i++) {
          const name = active[i];
          const docs = pages[i];
          result[name] = docs;
          if (docs.length) cursors[name] = docs[docs.length - 1];
          complete[name] = docs.length < pageSize;
        }
        return { pages: result, hasMore: collectionNames.some(name => !complete[name]) };
      })();
      try { return await pending; } finally { pending = null; }
    }
  };
}
