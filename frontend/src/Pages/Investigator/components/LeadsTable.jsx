import React from 'react';
import Filter from '../../../components/Filter/Filter';
import styles from '../Investigator.module.css';

/**
 * A sortable, filterable table for leads.
 *
 * Each column header renders a filter popup driven by the `filter` object
 * returned from `useTableFilter`. The caller supplies `renderRow` so each
 * table can define its own action buttons and cell formatting.
 *
 * @param {string[]} columns      - Ordered list of column display names.
 * @param {Object}   colKey       - Maps column name → data key (e.g. "Lead No." → "id").
 * @param {Object}   colWidths    - Maps column name → CSS width string.
 * @param {Array}    rows         - Pre-paginated row data to render.
 * @param {Object}   filter       - State/handlers from useTableFilter().
 * @param {Function} renderRow    - (lead) => <tr> element with cells and action button.
 * @param {string}   emptyMessage - Text shown when rows is empty.
 * @param {string}   [actionsLabel="Actions"] - Header label for the actions column.
 * @param {string}   [actionsWidth="11%"]     - CSS width of the actions column.
 */
export function LeadsTable({
  columns,
  colKey,
  colWidths,
  rows,
  filter,
  renderRow,
  emptyMessage,
  actionsLabel = 'Actions',
  actionsWidth  = '11%',
}) {
  const {
    popupRefs,
    openFilter,
    setOpenFilter,
    filterSearch,
    tempSelections,
    distinctValues,
    handleFilterSearch,
    isAllChecked,
    toggleSelectAll,
    toggleOne,
    applyFilter,
    handleSort,
  } = filter;

  return (
    <div className={styles['table-scroll-container']}>
      <table className={styles['leads-table']}>
        <thead>
          <tr>
            {columns.map(col => {
              const dk = colKey[col];
              return (
                <th
                  key={col}
                  className={styles['column-header1']}
                  style={{ width: colWidths[col] }}
                >
                  <div className={styles['header-title']}>
                    {col}
                    {/* Filter toggle + popup anchored to this header cell */}
                    <span ref={el => (popupRefs.current[dk] = el)}>
                      <button onClick={() => setOpenFilter(prev => prev === dk ? null : dk)}>
                        <img
                          src={`${process.env.PUBLIC_URL}/Materials/fs.png`}
                          className={styles['icon-image']}
                          alt="filter"
                        />
                      </button>
                      <Filter
                        dataKey={dk}
                        distinctValues={distinctValues}
                        open={openFilter === dk}
                        anchorRef={{ current: popupRefs.current[dk] }}
                        searchValue={filterSearch[dk] || ''}
                        selections={tempSelections[dk] || []}
                        onSearch={handleFilterSearch}
                        onSort={handleSort}
                        allChecked={isAllChecked}
                        onToggleAll={toggleSelectAll}
                        onToggleOne={toggleOne}
                        onApply={() => { applyFilter(dk); setOpenFilter(null); }}
                        onCancel={() => setOpenFilter(null)}
                      />
                    </span>
                  </div>
                </th>
              );
            })}
            <th style={{ width: actionsWidth, textAlign: 'center' }}>{actionsLabel}</th>
          </tr>
        </thead>

        <tbody>
          {rows.length > 0
            ? rows.map(renderRow)
            : (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '8px' }}>
                  {emptyMessage}
                </td>
              </tr>
            )
          }
        </tbody>
      </table>
    </div>
  );
}
