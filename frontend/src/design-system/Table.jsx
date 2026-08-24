import React from 'react';

export default function Table({ columns, data, onRowClick, emptyMessage = 'No data available' }) {
  if (!data?.length) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <p className="text-neutral-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row, i) => (
              <tr
                key={row.id || i}
                className={`
                  transition-colors duration-100
                  ${onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-neutral-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
