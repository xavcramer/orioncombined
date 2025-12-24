import React from 'react'
import { Link } from 'react-router-dom'
import TourFilter from './TourFilter.jsx'

export default function Catalog() {
  return (
    <div>
      <div
        style={{
          padding: 12,
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontWeight: 800 }}>OrionTour</div>
        <Link
          to="/admin/login"
          style={{
            textDecoration: 'none',
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          Админ
        </Link>
      </div>

      <TourFilter />
    </div>
  )
}
