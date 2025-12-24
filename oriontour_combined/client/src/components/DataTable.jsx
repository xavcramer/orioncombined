import React from 'react'

export default function DataTable({ columns = [], rows = [], rowKey = 'id', onRowClick }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#666',
                  borderBottom: '1px solid #eee',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.title || c.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r[rowKey]}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{ padding: '10px 12px', borderBottom: '1px solid #f2f2f2', verticalAlign: 'top' }}
                >
                  {c.render ? c.render(r) : String(r[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
