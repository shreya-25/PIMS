import { useState, useMemo, useRef } from 'react';

/**
 * Generic hook that provides column-level filtering and sorting for a data table.
 *
 * Pass module-level constant arrays for `filterKeys` to keep the hook's
 * memoization stable across renders.
 *
 * @param {Array}    data       - The full (unfiltered) row array.
 * @param {string[]} filterKeys - Data keys to support per-column filtering on.
 * @returns {Object} State and handler functions consumed by <LeadsTable />.
 */
export function useTableFilter(data, filterKeys) {
  // Ref map for positioning filter popups next to each column header
  const popupRefs = useRef({});

  const [openFilter,      setOpenFilter]      = useState(null);
  const [filterConfig,    setFilterConfig]    = useState(() =>
    Object.fromEntries(filterKeys.map(k => [k, []]))
  );
  const [tempSelections,  setTempSelections]  = useState({});
  const [filterSearch,    setFilterSearch]    = useState({});
  const [sortConfig,      setSortConfig]      = useState({ key: null, direction: 'asc' });

  // Build the set of distinct values for each filterable column
  const distinctValues = useMemo(() => {
    const map = Object.fromEntries(filterKeys.map(k => [k, new Set()]));
    data.forEach(row => {
      filterKeys.forEach(key => {
        const val = row[key];
        if (Array.isArray(val)) val.forEach(v => map[key].add(String(v)));
        else if (val != null)   map[key].add(String(val));
      });
    });
    return Object.fromEntries(
      Object.entries(map).map(([k, s]) => [k, Array.from(s)])
    );
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply active filters, then apply the current sort
  const sortedData = useMemo(() => {
    let rows = data.filter(row =>
      Object.entries(filterConfig).every(([key, sel]) => {
        if (!sel.length) return true;
        const val = row[key];
        if (Array.isArray(val)) return val.some(v => sel.includes(String(v)));
        return sel.includes(String(val));
      })
    );

    const { key, direction } = sortConfig;
    if (key) {
      rows = rows.slice().sort((a, b) => {
        if (key === 'id') {
          const aNum = Number(a[key] ?? 0), bNum = Number(b[key] ?? 0);
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        const aV = Array.isArray(a[key]) ? a[key][0] : String(a[key] ?? '');
        const bV = Array.isArray(b[key]) ? b[key][0] : String(b[key] ?? '');
        return direction === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
      });
    }

    return rows;
  }, [data, filterConfig, sortConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handler functions ───────────────────────────────────────────────────

  const handleFilterSearch = (key, text) =>
    setFilterSearch(fs => ({ ...fs, [key]: text }));

  const isAllChecked = key =>
    (tempSelections[key] || []).length === (distinctValues[key] || []).length;

  const toggleSelectAll = key => {
    const all = distinctValues[key] || [];
    setTempSelections(ts => ({
      ...ts,
      [key]: ts[key]?.length === all.length ? [] : [...all],
    }));
  };

  const toggleOne = (key, value) =>
    setTempSelections(ts => {
      const sel = ts[key] || [];
      return {
        ...ts,
        [key]: sel.includes(value) ? sel.filter(v => v !== value) : [...sel, value],
      };
    });

  const applyFilter = key =>
    setFilterConfig(fc => ({ ...fc, [key]: tempSelections[key] || [] }));

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
    setOpenFilter(null);
  };

  return {
    popupRefs,
    openFilter,
    setOpenFilter,
    filterSearch,
    tempSelections,
    distinctValues,
    sortedData,
    handleFilterSearch,
    isAllChecked,
    toggleSelectAll,
    toggleOne,
    applyFilter,
    handleSort,
  };
}
